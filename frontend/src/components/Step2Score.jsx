import { motion } from "framer-motion";
import { RingGauge } from "./RingGauge";
import { ToolkitTeaser } from "./ToolkitTeaser";
import { BreakdownDonut } from "./BreakdownDonut";
import { CATEGORY_COLORS } from "../constants";
import { formatTonnesFromKg, UNIT_METRIC_TONNES_YR } from "../utils/formatEmissions";

const BREAKDOWN_ORDER = ["commute", "flights", "diet", "shopping", "home"];

const tierCopy = {
  below_average: {
    label: "Below US average",
    sub: "Lower emissions than a typical US footprint.",
    className: "tier-badge--good",
  },
  average: {
    label: "Near US average",
    sub: "Roughly in line with typical US per-capita emissions.",
    className: "tier-badge--mid",
  },
  above_average: {
    label: "Above US average",
    sub: "Higher than typical US per-capita emissions — room to improve.",
    className: "tier-badge--high",
  },
};

export function Step2Score({ footprint, gamify, onNext, onBack, onOpenToolkit }) {
  if (!footprint) return null;

  const tier = tierCopy[footprint.comparison?.relativeToUs] || tierCopy.average;
  const over = footprint.carbonBudget?.status !== "within";
  const targetKg = footprint.carbonBudget.targetAnnualKg;
  const annualKg = footprint.annualKgCO2e;
  const scaleMax = Math.max(annualKg, targetKg, 1) * 1.06;
  const targetPct = Math.min(100, (targetKg / scaleMax) * 100);
  const youPct = Math.min(100, (annualKg / scaleMax) * 100);
  const breakdownSlices = BREAKDOWN_ORDER.map((key) => ({
    key,
    kg: footprint.breakdownKg?.[key] ?? 0,
    color: CATEGORY_COLORS[key] || "#94a3b8",
  }));

  return (
    <motion.section
      className="step-panel step-panel--2"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-card dashboard-card">
        <h2 className="step-form__title">Your carbon score</h2>
        <p className="step-form__lead">
          Annual footprint, how you compare globally and in the US, and where emissions come from.
        </p>

        <div className="score-hero">
          <RingGauge
            annualKg={footprint.annualKgCO2e}
            globalAverageKg={footprint.comparison?.globalAverageAnnualKg}
          />
          <div className="score-hero__meta">
            <motion.div
              className={`tier-badge ${tier.className}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 22 }}
            >
              <span className="tier-badge__grade">{footprint.grade}</span>
              <div>
                <strong>{tier.label}</strong>
                <p>{tier.sub}</p>
              </div>
            </motion.div>
            <div className="mini-stats">
              <div className="mini-stat">
                <span className="mini-stat__val">{footprint.footprintScore}</span>
                <span className="mini-stat__lbl">Sustainability score</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat__val">
                  {formatTonnesFromKg(footprint.annualKgCO2e, 2)}
                </span>
                <span className="mini-stat__lbl">{UNIT_METRIC_TONNES_YR}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="compare-grid">
          <motion.article
            className="compare-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <span className="compare-card__icon" aria-hidden>
              🌍
            </span>
            <h4>Global average</h4>
            <p className="compare-card__num">
              ~{formatTonnesFromKg(footprint.comparison.globalAverageAnnualKg, 1)} metric tonnes / yr
            </p>
            <p className="compare-card__hint">
              You are at <strong>{footprint.comparison.yourPercentOfGlobalAverage}%</strong> of that
              benchmark.
            </p>
          </motion.article>
          <motion.article
            className="compare-card compare-card--us"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <span className="compare-card__icon" aria-hidden>
              🇺🇸
            </span>
            <h4>US average</h4>
            <p className="compare-card__num">
              ~
              {formatTonnesFromKg(footprint.comparison.usAverageAnnualKg ?? 14900, 1)} metric tonnes /
              yr
            </p>
            <p className="compare-card__hint">
              You are at <strong>{footprint.comparison.yourPercentOfUsAverage ?? "—"}%</strong> of
              that benchmark.
            </p>
          </motion.article>
        </div>

        <div className="budget-meter">
          <h3 className="section-heading">Carbon budget</h3>
          <p className="budget-meter__lede">
            Your yearly emissions compared to a fair-share target (roughly aligned with global climate
            goals).
          </p>

          <div className="budget-meter__cards">
            <div className="budget-meter__card">
              <span className="budget-meter__card-label">Your footprint</span>
              <span className="budget-meter__card-value">
                {formatTonnesFromKg(annualKg, 2)}
              </span>
              <span className="budget-meter__card-unit">{UNIT_METRIC_TONNES_YR}</span>
            </div>
            <div className="budget-meter__card budget-meter__card--target">
              <span className="budget-meter__card-label">Fair share target</span>
              <span className="budget-meter__card-value">
                ~{formatTonnesFromKg(targetKg, 2)}
              </span>
              <span className="budget-meter__card-unit">{UNIT_METRIC_TONNES_YR}</span>
            </div>
          </div>

          <div
            className={`budget-meter__status ${over ? "budget-meter__status--over" : "budget-meter__status--ok"}`}
            role="status"
          >
            <span className="budget-meter__status-icon" aria-hidden>
              {over ? "⚠" : "✓"}
            </span>
            <span>
              {footprint.carbonBudget.status === "within"
                ? `${formatTonnesFromKg(footprint.carbonBudget.remainingKg, 2)} metric tonnes under target — room to improve or stay steady.`
                : `${formatTonnesFromKg(footprint.carbonBudget.overBudgetKg, 2)} metric tonnes above target — focus on high-impact cuts.`}
            </span>
          </div>

          <div
            className="budget-meter__viz"
            aria-label={`Scale from 0 to ${formatTonnesFromKg(scaleMax, 2)} metric tonnes. Target at ${formatTonnesFromKg(targetKg, 2)} t, your footprint at ${formatTonnesFromKg(annualKg, 2)} t.`}
          >
            <div className="budget-meter__track">
              <div className="budget-meter__safe" style={{ width: `${targetPct}%` }} />
              <div className="budget-meter__target-cap" style={{ left: `${targetPct}%` }} />
              <motion.div
                className="budget-meter__you"
                initial={{ left: "0%" }}
                animate={{ left: `${youPct}%` }}
                transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                style={{
                  position: "absolute",
                  top: "50%",
                  x: "-50%",
                  y: "-50%",
                }}
              />
            </div>
            <div className="budget-meter__ticks">
              <span>0</span>
              <span className="budget-meter__tick-target">Target</span>
              <span>{formatTonnesFromKg(scaleMax, 2)} t</span>
            </div>
          </div>
        </div>

        <div className="emissions-breakdown">
          <h3 className="emissions-breakdown__title">Emissions breakdown</h3>
          <p className="emissions-breakdown__sub">
            Share of your annual footprint by category (metric tonnes CO₂e).
          </p>
          <div className="emissions-breakdown__grid">
            <ul className="emissions-breakdown__list">
              {breakdownSlices.map(({ key, kg, color }, i) => (
                <motion.li
                  key={key}
                  className="emissions-breakdown__row"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                >
                  <span
                    className="emissions-breakdown__check"
                    style={{ background: color }}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="emissions-breakdown__name">{key}</span>
                  <span className="emissions-breakdown__val">{formatTonnesFromKg(kg, 2)} t</span>
                </motion.li>
              ))}
            </ul>
            <div className="emissions-breakdown__chart-wrap">
              <BreakdownDonut slices={breakdownSlices} totalKg={footprint.annualKgCO2e} size={300} />
            </div>
          </div>
        </div>

        {gamify && (
          <ToolkitTeaser gamify={gamify} variant="score" onOpenToolkit={onOpenToolkit} />
        )}

        <div className="step-actions">
          <button type="button" className="btn-ghost" onClick={onBack}>
            ← Edit lifestyle
          </button>
          <motion.button
            type="button"
            className="btn-cta"
            onClick={onNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Continue to marketplace →
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
