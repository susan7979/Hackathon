/** Rolling window between weekly check-in submissions (7×24h). */
export const WEEKLY_CHECKIN_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function weeklyCheckInStorageKey(userId) {
  return `cfn_weekly_checkin_submitted_at_${userId || "anon"}`;
}

/** Persist ISO timestamp after a successful dashboard / carbon score submission. */
export function recordWeeklyCheckInSubmitted(userId) {
  try {
    localStorage.setItem(weeklyCheckInStorageKey(userId), new Date().toISOString());
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {string|undefined|null} userId
 * @param {number} [nowMs]
 * @returns {{ blocked: boolean, msRemaining: number, lastSubmittedAt: Date|null, nextAllowedAt: Date|null }}
 */
export function getWeeklyCheckInCooldownState(userId, nowMs = Date.now()) {
  let raw = null;
  try {
    raw = localStorage.getItem(weeklyCheckInStorageKey(userId));
  } catch {
    return { blocked: false, msRemaining: 0, lastSubmittedAt: null, nextAllowedAt: null };
  }
  if (!raw) {
    return { blocked: false, msRemaining: 0, lastSubmittedAt: null, nextAllowedAt: null };
  }
  const lastMs = new Date(raw).getTime();
  if (!Number.isFinite(lastMs)) {
    return { blocked: false, msRemaining: 0, lastSubmittedAt: null, nextAllowedAt: null };
  }
  const nextAllowedMs = lastMs + WEEKLY_CHECKIN_COOLDOWN_MS;
  const msRemaining = Math.max(0, nextAllowedMs - nowMs);
  return {
    blocked: msRemaining > 0,
    msRemaining,
    lastSubmittedAt: new Date(lastMs),
    nextAllowedAt: new Date(nextAllowedMs),
  };
}

/** Human-readable countdown, e.g. "4d 3h" or "45m". */
export function formatCooldownRemaining(ms) {
  if (ms <= 0) return "";
  const totalSec = Math.ceil(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}
