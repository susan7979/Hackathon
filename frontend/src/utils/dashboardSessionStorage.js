/** Persist last dashboard / weekly carbon score so it survives step changes and reloads. */

export function dashboardSessionStorageKey(userId) {
  return `cfn_dashboard_session_${userId || "anon"}`;
}

/**
 * @param {string|undefined|null} userId
 * @param {{ result: { footprint?: unknown } | null; habits: unknown }} payload
 */
export function saveDashboardSession(userId, { result, habits }) {
  if (!userId || !result?.footprint) return;
  try {
    const payload = JSON.stringify({ result, habits, savedAt: new Date().toISOString() });
    localStorage.setItem(dashboardSessionStorageKey(userId), payload);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {string|undefined|null} userId
 * @returns {{ result: object; habits: object } | null}
 */
export function loadDashboardSession(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(dashboardSessionStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.result?.footprint) return null;
    return { result: parsed.result, habits: parsed.habits };
  } catch {
    return null;
  }
}
