/** Display helpers: API footprint math stays in kg CO₂e; UI shows metric tonnes. */

export function kgToTonnes(kg) {
  const n = Number(kg);
  if (!Number.isFinite(n)) return 0;
  return n / 1000;
}

/**
 * @param {number} kg
 * @param {number} [maxDecimals=2]
 */
export function formatTonnesFromKg(kg, maxDecimals = 2) {
  const t = kgToTonnes(kg);
  return t.toLocaleString(undefined, {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: 0,
  });
}

/** Compact unit label for annual totals */
export const UNIT_T_CO2E_YR = "t CO₂e / yr";

/** Longer label when “metric tonnes” is clearer */
export const UNIT_METRIC_TONNES_YR = "metric tonnes CO₂e / yr";

/** Weekly carbon total */
export const UNIT_METRIC_TONNES_WK = "metric tonnes CO₂e / week";

/** Short weekly label for compact UI (ring gauge; /W = per week) */
export const UNIT_T_CO2E_WK = "t CO₂e/W";
