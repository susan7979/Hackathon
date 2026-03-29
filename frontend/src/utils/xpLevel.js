/** Level curve: higher levels need more total XP (soft cap at 99). */
export function levelFromTotalXp(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  if (xp < 150) return 1;
  if (xp < 400) return 2;
  if (xp < 800) return 3;
  if (xp < 1400) return 4;
  if (xp < 2200) return 5;
  if (xp < 3200) return 6;
  if (xp < 4500) return 7;
  if (xp < 6000) return 8;
  if (xp < 8000) return 9;
  if (xp < 10500) return 10;
  const extra = xp - 10500;
  return Math.min(99, 11 + Math.floor(extra / 2500));
}

/** XP threshold to reach the *next* level (for progress bar). */
export function xpThresholdForLevel(level) {
  const table = [0, 150, 400, 800, 1400, 2200, 3200, 4500, 6000, 8000, 10500];
  if (level < 11) return table[level] ?? 0;
  return 10500 + (level - 11) * 2500;
}

/** Fraction 0–1 of progress from current level to next. */
export function levelProgress(totalXp) {
  const lvl = levelFromTotalXp(totalXp);
  const cur = xpThresholdForLevel(lvl);
  const next = xpThresholdForLevel(lvl + 1);
  if (next <= cur) return 1;
  const p = (totalXp - cur) / (next - cur);
  return Math.max(0, Math.min(1, p));
}

/** Streak multiplier for bonus XP on weekly challenges (cap 2×). */
export function streakXpMultiplier(streakDays) {
  const s = Math.max(0, Math.min(40, Number(streakDays) || 0));
  return Math.min(2, 1 + s * 0.035);
}
