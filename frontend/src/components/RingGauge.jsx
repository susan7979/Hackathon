import { motion, useReducedMotion } from "framer-motion";
import { formatTonnesFromKg, UNIT_T_CO2E_YR } from "../utils/formatEmissions";

const R = 52;
const C = 2 * Math.PI * R;
const SIZE = 140;

const DEFAULT_GLOBAL_KG = 4700;

/**
 * Animated ring: fill reflects footprint intensity vs 2× global average (capped).
 */
export function RingGauge({ annualKg, globalAverageKg, className = "" }) {
  const reduce = useReducedMotion();
  const cap = Math.max((globalAverageKg || DEFAULT_GLOBAL_KG) * 2, annualKg || 1);
  const progress = Math.min(1, (annualKg || 0) / cap);

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
          key={annualKg}
          initial={reduce ? false : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          {formatTonnesFromKg(annualKg ?? 0, 2)}
        </motion.span>
        <span className="ring-gauge__unit">{UNIT_T_CO2E_YR}</span>
      </div>
    </div>
  );
}
