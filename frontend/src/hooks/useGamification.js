import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ACHIEVEMENT_DEFS,
  countChallengeCheckIns,
  evaluateAchievementStars,
  LEGACY_BADGE_STARS,
  totalXpFromAchievementStars,
} from "../data/xpAchievements";
import { levelFromTotalXp, streakXpMultiplier } from "../utils/xpLevel";
import { submitGamifyXp } from "../api";

const KEY = "cfn-gamify-v2";

function today() {
  return new Date().toDateString();
}

function isoWeekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t - y) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(w).padStart(2, "0")}`;
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return migrate(raw);
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
  return out;
}

function savePersist(data) {
  const { completedChallenges: _c, ...persist } = data;
  localStorage.setItem(KEY, JSON.stringify(persist));
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

const CHALLENGE_BASE_XP = 22;

export function useGamification(footprint, options = {}) {
  const { selectedOffsetId, step, userId } = options;
  const [state, setState] = useState(() => ({
    ...load(),
    completedChallenges: [],
  }));

  const xpSyncRef = useRef(null);
  const prevStepRef = useRef(null);

  const streak = state.streak || 0;
  const streakMult = streakXpMultiplier(streak);

  useEffect(() => {
    const s = load();
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
      const next = {
        ...s,
        lastVisit: d,
        streak: nextStreak,
        maxStreak,
        completedChallenges: prev.completedChallenges || [],
      };
      savePersist(next);
      return next;
    });
  }, []);

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
  }, [step]);

  const weeklyChallengeCheckIns = useMemo(
    () => countChallengeCheckIns(state.xpWeeklyClaims),
    [state.xpWeeklyClaims]
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
      pledgeCount: state.pledgeCount || 0,
      marketplaceVisits: state.marketplaceVisits || 0,
      hubTabsVisitedCount,
      offsetSelected: Boolean(selectedOffsetId),
      weeklyChallengeCheckIns,
    });
  }, [
    footprint?.annualKgCO2e,
    footprint?.carbonBudget?.status,
    footprint?.comparison?.relativeToUs,
    state.streak,
    state.pledgeCount,
    state.marketplaceVisits,
    state.hubTabs,
    weeklyChallengeCheckIns,
    selectedOffsetId,
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
  }, [achievementCtx]);

  const achievementXp = useMemo(
    () => totalXpFromAchievementStars(state.achievementStars || {}),
    [state.achievementStars]
  );

  const challengeXp = useMemo(
    () => sumWeeklyClaims(state.xpWeeklyClaims),
    [state.xpWeeklyClaims]
  );

  const totalXp = achievementXp + challengeXp;
  const level = levelFromTotalXp(totalXp);

  useEffect(() => {
    if (!userId) return;
    if (xpSyncRef.current) clearTimeout(xpSyncRef.current);
    xpSyncRef.current = setTimeout(() => {
      submitGamifyXp(totalXp).catch(() => {});
    }, 900);
    return () => {
      if (xpSyncRef.current) clearTimeout(xpSyncRef.current);
    };
  }, [userId, totalXp]);

  const toggleChallenge = useCallback(
    (id) => {
      setState((prev) => {
        const done = new Set(prev.completedChallenges || []);
        const adding = !done.has(id);
        if (adding) done.add(id);
        else done.delete(id);

        let next = { ...prev, completedChallenges: [...done] };
        if (adding) {
          const wk = isoWeekKey();
          const week = { ...(prev.xpWeeklyClaims?.[wk] || {}) };
          if (week[id] == null) {
            const mult = streakXpMultiplier(prev.streak || 0);
            const gained = Math.round(CHALLENGE_BASE_XP * mult);
            week[id] = gained;
            next.xpWeeklyClaims = { ...(prev.xpWeeklyClaims || {}), [wk]: week };
          }
        }
        savePersist(next);
        return next;
      });
    },
    []
  );

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
  }, []);

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
  }, []);

  const recordHubTab = useCallback((tabId) => {
    setState((prev) => {
      const set = new Set(prev.hubTabs || []);
      set.add(tabId);
      const hubTabs = [...set];
      const next = { ...prev, hubTabs };
      savePersist(next);
      return next;
    });
  }, []);

  const recordMarketplaceVisit = useCallback(() => {
    setState((prev) => {
      const next = {
        ...prev,
        marketplaceVisits: (prev.marketplaceVisits || 0) + 1,
      };
      savePersist(next);
      return next;
    });
  }, []);

  return {
    ...state,
    streak,
    streakMultiplier: streakMult,
    achievementStars: state.achievementStars || {},
    achievementXp,
    challengeXp,
    totalXp,
    level,
    toggleChallenge,
    addPledge,
    unlockBadge,
    recordHubTab,
    recordMarketplaceVisit,
  };
}
