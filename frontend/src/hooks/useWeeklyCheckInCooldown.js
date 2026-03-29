import { useEffect, useMemo, useState } from "react";
import { getWeeklyCheckInCooldownState } from "../utils/weeklyCheckInCooldown";

/**
 * Recomputes cooldown when `refreshKey` changes (e.g. after a successful submit), every 30s while
 * mounted, so countdown stays fresh.
 */
export function useWeeklyCheckInCooldown(userId, refreshKey = 0) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(
    () => getWeeklyCheckInCooldownState(userId),
    [userId, tick, refreshKey]
  );
}
