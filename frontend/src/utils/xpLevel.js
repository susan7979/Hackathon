/**
 * CUTThecarbon level curve: total XP thresholds (minimum XP to *be* that level).
 * L1: 0–99, L2: 100–249, L3: 250–449, L4: 450–699, L5: 700–999, then scalable steps.
 */
const LEVEL_START_XP = [0];

function buildLevelStarts() {
  LEVEL_START_XP.length = 0;
  LEVEL_START_XP.push(0); // pad index 0
  LEVEL_START_XP[1] = 0;
  LEVEL_START_XP[2] = 100;
  LEVEL_START_XP[3] = 250;
  LEVEL_START_XP[4] = 450;
  LEVEL_START_XP[5] = 700;
  let x = 700;
  for (let L = 6; L <= 99; L++) {
    const step = 250 + (L - 5) * 50;
    x += Math.min(step, 2500);
    LEVEL_START_XP[L] = x;
  }
}

buildLevelStarts();

const LEVEL_TITLES = [
  "",
  "Beginner",
  "Conscious starter",
  "Green builder",
  "Eco warrior",
  "Climate champion",
  "Planetary ally",
  "Carbon strategist",
  "Regeneration lead",
  "Impact director",
  "Global steward",
  "Sustainability mentor",
  "Climate innovator",
  "Systems thinker",
  "Net-zero pathfinder",
  "Circular champion",
  "Resilience builder",
  "Policy advocate",
  "Community catalyst",
  "Restoration partner",
  "Future forester",
];

export function getLevelTitle(level) {
  const L = Math.max(1, Math.min(99, Math.floor(level) || 1));
  if (L < LEVEL_TITLES.length) return LEVEL_TITLES[L];
  if (L < 30) return "Climate veteran";
  if (L < 50) return "Legacy guardian";
  if (L < 75) return "Planet partner";
  return "Carbon luminary";
}

/** Current level (1–99) from lifetime total XP. */
export function levelFromTotalXp(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let level = 1;
  for (let L = 99; L >= 1; L--) {
    if (xp >= LEVEL_START_XP[L]) {
      level = L;
      break;
    }
  }
  return Math.min(99, level);
}

/** Minimum total XP required to reach `level` (level is 1-based). */
export function minXpForLevel(level) {
  const L = Math.max(1, Math.min(99, Math.floor(level) || 1));
  return LEVEL_START_XP[L] ?? 0;
}

/** XP required to enter the next level (undefined if already max). */
export function minXpForNextLevel(level) {
  const L = Math.floor(level) || 1;
  if (L >= 99) return undefined;
  return LEVEL_START_XP[L + 1];
}

/**
 * Progress within current level: 0–1.
 * At max level, returns 1 when XP >= last threshold.
 */
export function levelProgress(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  const lvl = levelFromTotalXp(xp);
  const cur = minXpForLevel(lvl);
  const next = minXpForNextLevel(lvl);
  if (next == null) return 1;
  if (next <= cur) return 1;
  return Math.max(0, Math.min(1, (xp - cur) / (next - cur)));
}

/** XP still needed to reach the next level (0 if max level). */
export function xpRemainingToNextLevel(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  const lvl = levelFromTotalXp(xp);
  const next = minXpForNextLevel(lvl);
  if (next == null) return 0;
  return Math.max(0, next - xp);
}

/** @deprecated Use minXpForLevel — kept for leaderboard code that imported this name. */
export function xpThresholdForLevel(level) {
  return minXpForLevel(level);
}

/**
 * Stepped visit-streak bonus for weekly challenge XP (product spec).
 * 3d +5%, 7d +10%, 14d +15%, 30d +25%.
 */
export function streakPercentBonus(streakDays) {
  const s = Math.max(0, Number(streakDays) || 0);
  if (s >= 30) return 0.25;
  if (s >= 14) return 0.15;
  if (s >= 7) return 0.1;
  if (s >= 3) return 0.05;
  return 0;
}

export function applyStreakBonus(baseXp, streakDays) {
  const b = Math.max(0, Number(baseXp) || 0);
  return Math.round(b * (1 + streakPercentBonus(streakDays)));
}

/** Multiplier for UI (e.g. ×1.10) — derived from stepped bonus. */
export function streakXpMultiplier(streakDays) {
  return 1 + streakPercentBonus(streakDays);
}
