/**
 * Portfolio / gamification business rules — pure functions for tests and future API workers.
 */
import {
  levelFromTotalXp,
  minXpForLevel,
  minXpForNextLevel,
  xpRemainingToNextLevel,
  levelProgress,
  getLevelTitle,
  applyStreakBonus,
} from "./xpLevel";
import { ACHIEVEMENT_DEFS, evaluateAchievementStars } from "../data/xpAchievements";
import { WEEKLY_CHALLENGE_POOL, getChallengeDefById } from "../data/weeklyChallengePool";

export { levelFromTotalXp as calculateLevelFromXp } from "./xpLevel";
export { xpRemainingToNextLevel as calculateXpToNextLevel } from "./xpLevel";
export { getLevelTitle } from "./xpLevel";
export { applyStreakBonus } from "./xpLevel";

/** @param {Record<string, number>} achievementStars achievementId -> 0–3 */
export function totalStarsEarned(achievementStars) {
  let s = 0;
  for (const def of ACHIEVEMENT_DEFS) {
    s += Math.min(3, Math.max(0, achievementStars?.[def.id] || 0));
  }
  return s;
}

/** Count weeks where all four slot IDs were completed. */
export function countPerfectChallengeWeeks(weeklySlots, weeklyDone) {
  if (!weeklySlots || typeof weeklySlots !== "object") return 0;
  let n = 0;
  for (const wk of Object.keys(weeklySlots)) {
    const slots = weeklySlots[wk];
    const done = weeklyDone?.[wk] || {};
    if (!Array.isArray(slots) || slots.length < 4) continue;
    if (slots.every((id) => done[id])) n += 1;
  }
  return n;
}

/**
 * Weeks with at least one completed challenge (for weekly activity streak).
 */
export function weeksWithAnyCompletion(xpWeeklyClaims) {
  if (!xpWeeklyClaims || typeof xpWeeklyClaims !== "object") return [];
  return Object.keys(xpWeeklyClaims).filter((wk) => {
    const o = xpWeeklyClaims[wk];
    return o && typeof o === "object" && Object.keys(o).length > 0;
  });
}

/**
 * Pick `count` challenge IDs for a new week, avoiding immediate repeats from `excludeIds`.
 */
export function replaceCompletedChallengePool(weekKey, excludeIds, pool = WEEKLY_CHALLENGE_POOL, count = 4) {
  const exclude = new Set(excludeIds || []);
  const poolIds = pool.map((c) => c.id);
  const shuffled = [...poolIds].sort(() => Math.random() - 0.5);
  const out = [];
  for (const id of shuffled) {
    if (out.length >= count) break;
    if (!exclude.has(id)) out.push(id);
  }
  let i = 0;
  while (out.length < count && i < poolIds.length) {
    const id = poolIds[i++];
    if (!out.includes(id)) out.push(id);
  }
  return out.slice(0, count);
}

/**
 * @typedef {'co2' | 'weekly' | 'projected' | 'improved' | 'xp'} LeaderboardMode
 * @param {Array<{ id: string, name: string, annualKg?: number, weeklyKg?: number, weekVsPriorPercent?: number, totalXp?: number, isYou?: boolean }>} users
 * @param {LeaderboardMode} mode
 */
export function generateLeaderboard(users, mode) {
  const list = (users || []).map((u) => ({ ...u }));
  if (mode === "co2" || mode === "weekly") {
    list.sort(
      (a, b) => (a.weeklyKg ?? a.annualKg ?? 1e12) - (b.weeklyKg ?? b.annualKg ?? 1e12)
    );
  } else if (mode === "projected") {
    list.sort((a, b) => (a.annualKg ?? 1e12) - (b.annualKg ?? 1e12));
  } else if (mode === "improved") {
    list.sort((a, b) => (a.weekVsPriorPercent ?? 0) - (b.weekVsPriorPercent ?? 0));
  } else {
    list.sort((a, b) => {
      const lx = levelFromTotalXp(b.totalXp ?? 0) - levelFromTotalXp(a.totalXp ?? 0);
      if (lx !== 0) return lx;
      return (b.totalXp ?? 0) - (a.totalXp ?? 0);
    });
  }
  return list;
}

const BADGE_BLUEPRINTS = [
  { id: "bdg_first_footprint", title: "First footprint", icon: "▣", type: "achievement", sourceKey: "first_footprint" },
  { id: "bdg_budget_hero", title: "Budget hero", icon: "◎", type: "achievement", sourceKey: "budget_hero" },
  { id: "bdg_below_avg", title: "Below average", icon: "◇", type: "achievement", sourceKey: "benchmark" },
  { id: "bdg_hub_explorer", title: "Hub explorer", icon: "⌖", type: "achievement", sourceKey: "hub_nomad" },
  { id: "bdg_pledger", title: "Pledger", icon: "✋", type: "achievement", sourceKey: "pledge" },
  { id: "bdg_streak_3", title: "3-day streak", icon: "▴", type: "streak", minStreak: 3 },
  { id: "bdg_streak_7", title: "7-day streak", icon: "▴", type: "streak", minStreak: 7 },
  { id: "bdg_challenge_finisher", title: "Challenge finisher", icon: "✓", type: "challenge", minPerfectWeeks: 1 },
  { id: "bdg_eco_warrior", title: "Eco warrior", icon: "◆", type: "level", minLevel: 4 },
  { id: "bdg_climate_champion", title: "Climate champion", icon: "◆", type: "level", minLevel: 5 },
  { id: "bdg_transit_pro", title: "Transit pro", icon: "→", type: "achievement", sourceKey: "transit_switcher" },
  { id: "bdg_plant_power", title: "Plant power", icon: "◇", type: "achievement", sourceKey: "plant_based" },
];

/**
 * Derives display badges from user progress (client-side; mirror rules in backend when persisting UserBadge).
 */
export function getEarnedBadges(viewUser, now = new Date()) {
  const stars = viewUser.achievementStars || {};
  const streak = viewUser.streakDays || 0;
  const level = viewUser.level || 1;
  const perfectWeeks = viewUser.perfectChallengeWeeks ?? 0;
  const out = [];
  const iso = now.toISOString().slice(0, 10);

  for (const b of BADGE_BLUEPRINTS) {
    let earned = false;
    if (b.type === "achievement" && b.sourceKey) {
      earned = (stars[b.sourceKey] || 0) >= 1;
    } else if (b.type === "streak") {
      earned = streak >= (b.minStreak || 0);
    } else if (b.type === "level") {
      earned = level >= (b.minLevel || 99);
    } else if (b.type === "challenge") {
      earned = perfectWeeks >= (b.minPerfectWeeks || 1);
    }
    if (earned) {
      out.push({
        id: b.id,
        title: b.title,
        icon: b.icon,
        description: `${b.title} — unlocked in CUTThecarbon`,
        badgeType: b.type,
        earnedAt: iso,
        relatedSource: b.type,
      });
    }
  }
  return out;
}

/**
 * Build weekly challenge rows for UI from persisted slots + completion + XP map.
 */
export function buildWeeklyChallengeRows(weekKey, slotIds, weeklyDone, xpWeeklyClaims) {
  const done = weeklyDone?.[weekKey] || {};
  const claims = xpWeeklyClaims?.[weekKey] || {};
  const ids = slotIds?.length ? slotIds : WEEKLY_CHALLENGE_POOL.slice(0, 4).map((c) => c.id);
  return ids.map((id) => {
    const def = getChallengeDefById(id);
    if (!def) return null;
    const completed = Boolean(done[id] || claims[id] != null);
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      badge: def.badge,
      estimatedCo2Label: def.kgHint,
      baseXp: def.baseXp,
      xpReward: claims[id] != null ? claims[id] : def.baseXp,
      completed,
      weekIdentifier: weekKey,
    };
  }).filter(Boolean);
}

/**
 * Sum XP awarded for challenges this ISO week (from claims object).
 */
export function weeklyChallengesXpTotal(weekKey, xpWeeklyClaims) {
  const w = xpWeeklyClaims?.[weekKey];
  if (!w || typeof w !== "object") return 0;
  let s = 0;
  for (const v of Object.values(w)) s += Number(v) || 0;
  return s;
}

/** Human-readable range for an ISO week key `YYYY-Www` (UTC Monday–Sunday). */
export function formatIsoWeekRangeDisplay(wkStr) {
  const m = /^(\d{4})-W(\d{2})$/.exec(wkStr);
  if (!m) return wkStr;
  const y = Number(m[1]);
  const w = Number(m[2]);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const mondayW1 = new Date(jan4);
  mondayW1.setUTCDate(jan4.getUTCDate() - (dow - 1));
  const start = new Date(mondayW1);
  start.setUTCDate(mondayW1.getUTCDate() + (w - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const opts = { month: "short", day: "numeric", timeZone: "UTC" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

/**
 * Server template: after validating anti-cheat rules, grant XP and persist rows in `xp_log`
 * + `user_achievement_progress`.
 */
export function awardAchievementXpDraft(userId, achievementId, starTier, xpDelta) {
  return { userId, achievementId, starTier, xpDelta, persisted: false };
}

/**
 * Maps aggregate activity (footprint, pledges, claims…) to stars for one achievement id.
 */
export function calculateAchievementStarProgress(evalCtx, achievementId) {
  const all = evaluateAchievementStars(evalCtx);
  return { achievementId, stars: all[achievementId] || 0, snapshot: all };
}

/**
 * Server: mark `user_weekly_challenge` complete, write `xp_log`, optionally rotate next week’s slots.
 */
export function completeWeeklyChallengeDraft(userId, isoWeek, challengeId, xpAwarded) {
  return { userId, isoWeek, challengeId, xpAwarded, persisted: false };
}

export function portfolioXpSnapshot(totalXp) {
  const level = levelFromTotalXp(totalXp);
  return {
    level,
    title: getLevelTitle(level),
    totalXp: Math.round(totalXp),
    minXpThisLevel: minXpForLevel(level),
    nextLevelXp: minXpForNextLevel(level),
    xpRemaining: xpRemainingToNextLevel(totalXp),
    progressFraction: levelProgress(totalXp),
  };
}
