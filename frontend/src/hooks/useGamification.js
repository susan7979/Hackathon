import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACHIEVEMENT_DEFS,
  countChallengeCheckIns,
  evaluateAchievementStars,
  LEGACY_BADGE_STARS,
  totalXpFromAchievementStars,
  totalXpFromAchievementStarsExcept,
} from "../data/xpAchievements";
import { WEEKLY_CHALLENGE_POOL, getChallengeDefById } from "../data/weeklyChallengePool";
import { levelFromTotalXp, streakXpMultiplier, applyStreakBonus } from "../utils/xpLevel";
import { replaceCompletedChallengePool, buildWeeklyChallengeRows } from "../utils/portfolioBusinessLogic";
import { submitGamificationState } from "../api";

const LEGACY_KEY = "cfn-gamify-v2";
const ANON_KEY = "cfn-gamify-v2-anon";

/** Per-user localStorage so multiple accounts on one browser do not share XP/badges. */
export function getGamifyStorageKey(userId) {
  if (userId != null && userId !== "") return `cfn-gamify-v2-u-${String(userId)}`;
  return ANON_KEY;
}

/* Weekly challenges: four IDs per ISO week in `weeklySlots`, completion flags in `weeklyDone`,
   and awarded amounts in `xpWeeklyClaims`. New weeks pick from the pool while avoiding last week’s
   IDs when possible (`replaceCompletedChallengePool`). */

function today() {
  return new Date().toDateString();
}

export function isoWeekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t - y) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, "0")}`;
}

function loadFromKey(key) {
  try {
    let raw = localStorage.getItem(key);
    if (key === ANON_KEY && (!raw || raw === "{}")) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy && legacy !== "{}" && legacy.trim() !== "") {
        localStorage.setItem(ANON_KEY, legacy);
        localStorage.removeItem(LEGACY_KEY);
        raw = legacy;
      }
    }
    return migrate(JSON.parse(raw || "{}"));
  } catch {
    return {};
  }
}

function migrate(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = { ...raw };
  if (!out.achievementStars) out.achievementStars = {};
  if (!out.xpWeeklyClaims) out.xpWeeklyClaims = {};
  if (!out.hubTabs) out.hubTabs = [];
  if (!out.weeklySlots) out.weeklySlots = {};
  if (!out.weeklyDone) out.weeklyDone = {};
  if (out.pledgeCount == null) out.pledgeCount = 0;
  if (out.marketplaceVisits == null) out.marketplaceVisits = 0;
  if (out.maxStreak == null) out.maxStreak = 0;
  if (Array.isArray(raw.badges)) {
    for (const b of raw.badges) {
      const map = LEGACY_BADGE_STARS[b];
      if (!map) continue;
      for (const [aid, minStars] of Object.entries(map)) {
        out.achievementStars[aid] = Math.max(out.achievementStars[aid] || 0, minStars);
      }
    }
  }
  const wd = { ...(out.weeklyDone || {}) };
  for (const [wk, week] of Object.entries(out.xpWeeklyClaims || {})) {
    if (!week || typeof week !== "object") continue;
    const row = { ...(wd[wk] || {}) };
    for (const id of Object.keys(week)) row[id] = true;
    wd[wk] = row;
  }
  out.weeklyDone = wd;
  return out;
}

function saveToKey(key, data) {
  const { completedChallenges: _c, ...persist } = data;
  localStorage.setItem(key, JSON.stringify(persist));
}

function sumWeeklyClaims(xpWeeklyClaims) {
  if (!xpWeeklyClaims || typeof xpWeeklyClaims !== "object") return 0;
  let s = 0;
  for (const w of Object.values(xpWeeklyClaims)) {
    if (!w || typeof w !== "object") continue;
    for (const v of Object.values(w)) s += Number(v) || 0;
  }
  return s;
}

/** Ensures four challenge IDs exist for the ISO week (rotates pool vs previous week). */
function ensureWeeklySlotsForWeek(prev, wk, storageKey) {
  if (prev.weeklySlots?.[wk]?.length >= 4) return prev;
  const keys = Object.keys(prev.weeklySlots || {}).sort();
  const prevWk = keys.filter((k) => k !== wk).pop();
  const prevIds = prevWk ? prev.weeklySlots[prevWk] : [];
  const ids = replaceCompletedChallengePool(wk, prevIds, WEEKLY_CHALLENGE_POOL, 4);
  const next = { ...prev, weeklySlots: { ...(prev.weeklySlots || {}), [wk]: ids } };
  if (storageKey) saveToKey(storageKey, next);
  return next;
}

export function useGamification(footprint, options = {}) {
  const { selectedOffsetId, step, userId, serverGamification } = options;
  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const savePersist = useCallback((data) => {
    saveToKey(getGamifyStorageKey(userIdRef.current), data);
  }, []);

  const [state, setState] = useState(() => ({
    ...loadFromKey(getGamifyStorageKey(undefined)),
    completedChallenges: [],
  }));

  const [weekTicker, setWeekTicker] = useState(() => isoWeekKey());
  const xpSyncRef = useRef(null);
  const prevStepRef = useRef(null);

  const streak = state.streak || 0;
  const streakMult = streakXpMultiplier(streak);

  useEffect(() => {
    const id = setInterval(() => {
      const n = isoWeekKey();
      setWeekTicker((p) => (p !== n ? n : p));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const key = getGamifyStorageKey(userId);
    const s = loadFromKey(key);
    const d = today();
    let nextStreak = s.streak || 0;
    if (s.lastVisit !== d) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (s.lastVisit === yesterday.toDateString()) nextStreak = (s.streak || 0) + 1;
      else if (!s.lastVisit) nextStreak = 1;
      else nextStreak = 1;
    }
    setState((prev) => {
      const maxStreak = Math.max(s.maxStreak || 0, nextStreak);
      let base = {
        ...s,
        lastVisit: d,
        streak: nextStreak,
        maxStreak,
        completedChallenges: prev.completedChallenges || [],
      };
      base = ensureWeeklySlotsForWeek(base, isoWeekKey(), key);
      saveToKey(key, base);
      return base;
    });
  }, [userId]);

  useEffect(() => {
    setState((prev) => {
      const key = getGamifyStorageKey(userIdRef.current);
      const next = ensureWeeklySlotsForWeek(prev, weekTicker, key);
      return next === prev ? prev : next;
    });
  }, [weekTicker]);

  useEffect(() => {
    if (step === 3 && prevStepRef.current !== 3) {
      setState((prev) => {
        const next = {
          ...prev,
          marketplaceVisits: (prev.marketplaceVisits || 0) + 1,
        };
        savePersist(next);
        return next;
      });
    }
    prevStepRef.current = step;
  }, [step, savePersist]);

  const weeklyChallengeCheckIns = useMemo(
    () => countChallengeCheckIns(state.xpWeeklyClaims),
    [state.xpWeeklyClaims]
  );

  const challengeXpVal = useMemo(
    () => sumWeeklyClaims(state.xpWeeklyClaims),
    [state.xpWeeklyClaims]
  );

  /** Basis for early_adopter tiers — excludes that achievement's XP to avoid a feedback loop. */
  const earlyAdopterBasisXp = useMemo(
    () =>
      totalXpFromAchievementStarsExcept(state.achievementStars || {}, "early_adopter") +
      challengeXpVal,
    [state.achievementStars, challengeXpVal]
  );

  const achievementCtx = useMemo(() => {
    const hubTabsVisitedCount = Array.isArray(state.hubTabs)
      ? new Set(state.hubTabs).size
      : 0;
    return evaluateAchievementStars({
      footprintKg: footprint?.annualKgCO2e,
      budgetStatus: footprint?.carbonBudget?.status,
      relativeToUs: footprint?.comparison?.relativeToUs,
      streak: state.streak || 0,
      maxStreak: state.maxStreak || 0,
      pledgeCount: state.pledgeCount || 0,
      marketplaceVisits: state.marketplaceVisits || 0,
      hubTabsVisitedCount,
      offsetSelected: Boolean(selectedOffsetId),
      weeklyChallengeCheckIns,
      xpWeeklyClaims: state.xpWeeklyClaims || {},
      weeklySlots: state.weeklySlots || {},
      weeklyDone: state.weeklyDone || {},
      earlyAdopterBasisXp,
    });
  }, [
    footprint?.annualKgCO2e,
    footprint?.carbonBudget?.status,
    footprint?.comparison?.relativeToUs,
    state.streak,
    state.maxStreak,
    state.pledgeCount,
    state.marketplaceVisits,
    state.hubTabs,
    weeklyChallengeCheckIns,
    state.xpWeeklyClaims,
    state.weeklySlots,
    state.weeklyDone,
    selectedOffsetId,
    earlyAdopterBasisXp,
  ]);

  useEffect(() => {
    setState((prev) => {
      const merged = { ...prev.achievementStars };
      let changed = false;
      for (const [id, n] of Object.entries(achievementCtx)) {
        const cur = merged[id] || 0;
        const next = Math.max(cur, n);
        if (next !== cur) {
          merged[id] = next;
          changed = true;
        }
      }
      if (!changed) return prev;
      const nextState = { ...prev, achievementStars: merged };
      const badges = new Set(prev.badges || []);
      for (const def of ACHIEVEMENT_DEFS) {
        if ((merged[def.id] || 0) > 0) badges.add(def.id);
      }
      nextState.badges = [...badges];
      savePersist(nextState);
      return nextState;
    });
  }, [achievementCtx, savePersist]);

  const achievementXp = useMemo(
    () => totalXpFromAchievementStars(state.achievementStars || {}),
    [state.achievementStars]
  );

  const challengeXp = challengeXpVal;
  const totalXp = achievementXp + challengeXp;
  const level = levelFromTotalXp(totalXp);

  const weeklyChallengeRows = useMemo(() => {
    const wk = isoWeekKey();
    const slots = state.weeklySlots?.[wk];
    const ids =
      slots?.length >= 4 ? slots : WEEKLY_CHALLENGE_POOL.slice(0, 4).map((c) => c.id);
    return buildWeeklyChallengeRows(wk, ids, state.weeklyDone, state.xpWeeklyClaims);
  }, [state.weeklySlots, state.weeklyDone, state.xpWeeklyClaims]);

  /** Merge server-stored stars/badges (e.g. after login) without lowering local progress. */
  const serverSyncKey = useMemo(() => {
    if (!serverGamification) return "";
    return JSON.stringify({
      s: serverGamification.achievementStars || {},
      b: serverGamification.badgesEarned || [],
    });
  }, [serverGamification]);

  useEffect(() => {
    if (!userId || !serverGamification) return;
    const serverStars = serverGamification.achievementStars;
    const serverBadges = serverGamification.badgesEarned;
    const hasStars = serverStars && typeof serverStars === "object" && Object.keys(serverStars).length > 0;
    const hasBadges = Array.isArray(serverBadges) && serverBadges.length > 0;
    if (!hasStars && !hasBadges) return;

    setState((prev) => {
      const mergedStars = { ...(prev.achievementStars || {}) };
      let starChanged = false;
      if (hasStars) {
        for (const [k, v] of Object.entries(serverStars)) {
          const n = Math.min(3, Math.max(0, Math.round(Number(v)) || 0));
          const cur = mergedStars[k] || 0;
          const next = Math.max(cur, n);
          if (next !== cur) {
            mergedStars[k] = next;
            starChanged = true;
          }
        }
      }
      const badges = new Set(prev.badges || []);
      let badgeChanged = false;
      if (hasBadges) {
        for (const b of serverBadges) {
          const id = String(b);
          if (!badges.has(id)) {
            badges.add(id);
            badgeChanged = true;
          }
        }
      }
      if (!starChanged && !badgeChanged) return prev;
      const nextState = {
        ...prev,
        achievementStars: starChanged ? mergedStars : prev.achievementStars,
        badges: [...badges],
      };
      savePersist(nextState);
      return nextState;
    });
  }, [userId, serverSyncKey, serverGamification, savePersist]);

  const gamifySyncKey = useMemo(
    () =>
      JSON.stringify({
        totalXp,
        level,
        stars: state.achievementStars || {},
        badges: state.badges || [],
      }),
    [totalXp, level, state.achievementStars, state.badges]
  );

  useEffect(() => {
    if (!userId) return;
    if (xpSyncRef.current) clearTimeout(xpSyncRef.current);
    xpSyncRef.current = setTimeout(() => {
      submitGamificationState({
        totalXp,
        level,
        achievementStars: { ...(state.achievementStars || {}) },
        badgesEarned: [...(state.badges || [])],
      }).catch(() => {});
    }, 900);
    return () => {
      if (xpSyncRef.current) clearTimeout(xpSyncRef.current);
    };
  }, [userId, gamifySyncKey, totalXp, level, state.achievementStars, state.badges]);

  const toggleChallenge = useCallback((id) => {
    setState((prev) => {
      const sk = getGamifyStorageKey(userIdRef.current);
      let base = ensureWeeklySlotsForWeek(prev, isoWeekKey(), sk);
      const wk = isoWeekKey();
      const slots = base.weeklySlots?.[wk] || [];
      if (!slots.includes(id)) return base === prev ? prev : base;

      const claims = base.xpWeeklyClaims?.[wk] || {};
      const doneWk = { ...(base.weeklyDone?.[wk] || {}) };
      const hadClaim = claims[id] != null;
      const wasDone = Boolean(doneWk[id] || hadClaim);
      const adding = !wasDone;

      const completedSet = new Set(base.completedChallenges || []);
      if (adding) completedSet.add(id);
      else completedSet.delete(id);

      let next = { ...base, completedChallenges: [...completedSet] };

      if (adding) {
        doneWk[id] = true;
        const week = { ...claims };
        if (week[id] == null) {
          const def = getChallengeDefById(id);
          const baseXp = def?.baseXp ?? 22;
          const gained = applyStreakBonus(baseXp, base.streak || 0);
          week[id] = gained;
          next.xpWeeklyClaims = { ...(base.xpWeeklyClaims || {}), [wk]: week };
        }
      } else {
        delete doneWk[id];
      }

      next.weeklyDone = { ...(base.weeklyDone || {}), [wk]: doneWk };
      savePersist(next);
      return next;
    });
  }, [savePersist]);

  const addPledge = useCallback((_text) => {
    const kg = 50 + Math.floor(Math.random() * 80);
    setState((prev) => {
      const next = {
        ...prev,
        pledgeCount: (prev.pledgeCount || 0) + 1,
        collectiveDemoKg: (prev.collectiveDemoKg || 12400) + kg,
        badges: [...new Set([...(prev.badges || []), "pledge"])],
      };
      savePersist(next);
      return next;
    });
  }, [savePersist]);

  const unlockBadge = useCallback((id) => {
    setState((prev) => {
      if ((prev.badges || []).includes(id) && !LEGACY_BADGE_STARS[id]) return prev;
      const map = LEGACY_BADGE_STARS[id];
      const achievementStars = { ...(prev.achievementStars || {}) };
      if (map) {
        for (const [aid, minStars] of Object.entries(map)) {
          achievementStars[aid] = Math.max(achievementStars[aid] || 0, minStars);
        }
      }
      const badges = [...new Set([...(prev.badges || []), id])];
      const next = { ...prev, badges, achievementStars };
      savePersist(next);
      return next;
    });
  }, [savePersist]);

  const recordHubTab = useCallback((tabId) => {
    setState((prev) => {
      const set = new Set(prev.hubTabs || []);
      set.add(tabId);
      const hubTabs = [...set];
      const next = { ...prev, hubTabs };
      savePersist(next);
      return next;
    });
  }, [savePersist]);

  const recordMarketplaceVisit = useCallback(() => {
    setState((prev) => {
      const next = {
        ...prev,
        marketplaceVisits: (prev.marketplaceVisits || 0) + 1,
      };
      savePersist(next);
      return next;
    });
  }, [savePersist]);

  return {
    ...state,
    streak,
    streakMultiplier: streakMult,
    achievementStars: state.achievementStars || {},
    achievementXp,
    challengeXp,
    totalXp,
    level,
    weeklyChallengeRows,
    toggleChallenge,
    addPledge,
    unlockBadge,
    recordHubTab,
    recordMarketplaceVisit,
  };
}
