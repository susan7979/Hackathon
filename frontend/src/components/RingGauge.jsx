import { motion, useReducedMotion } from "framer-motion";
import { formatTonnesFromKg, UNIT_T_CO2E_WK } from "../utils/formatEmissions";

const R = 52;
const C = 2 * Math.PI * R;
const SIZE = 140;

const DEFAULT_GLOBAL_ANNUAL_KG = 4700;

/**
 * Ring fill vs ~2× benchmark weekly intensity (capped).
 * @param {number} [props.valueKg] — weekly kg CO₂e (preferred)
 * @param {number} [props.annualKg] — legacy: annual kg (if valueKg omitted)
 * @param {number} [props.benchmarkAnnualKg] — global annual reference (default 4700)
 */
export function RingGauge({
  valueKg,
  annualKg,
  globalAverageKg,
  benchmarkAnnualKg,
  unitLabel,
  className = "",
}) {
  const reduce = useReducedMotion();
  const weeklyKg =
    valueKg != null
      ? Number(valueKg)
      : annualKg != null
        ? Number(annualKg) / 52
        : 0;
  const globalAnnual = globalAverageKg ?? benchmarkAnnualKg ?? DEFAULT_GLOBAL_ANNUAL_KG;
  const weeklyRef = globalAnnual / 52;
  const cap = Math.max(weeklyRef * 2, weeklyKg || 1);
  const progress = Math.min(1, (weeklyKg || 0) / cap);
  const label = unitLabel || UNIT_T_CO2E_WK;

  return (
    <div className={`ring-gauge ${className}`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ring-start)" />
            <stop offset="100%" stopColor="var(--ring-end)" />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth="10"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          initial={reduce ? false : { strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - progress) }}
          transition={{ duration: reduce ? 0 : 1.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="ring-gauge__center">
        <motion.span
          className="ring-gauge__value"
          key={weeklyKg}
          initial={reduce ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          {formatTonnesFromKg(weeklyKg ?? 0, 2)}
        </motion.span>
        <span className="ring-gauge__unit">{label}</span>
      </div>
    </div>
  );
}
