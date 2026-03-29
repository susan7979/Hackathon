import { motion } from "framer-motion";
import { RingGauge } from "./RingGauge";
import { ToolkitTeaser } from "./ToolkitTeaser";
import { BreakdownDonut } from "./BreakdownDonut";
import { CarbonScorePdfButton } from "./CarbonScorePdfButton";
import { CATEGORY_COLORS } from "../constants";
import { formatTonnesFromKg, UNIT_METRIC_TONNES_WK } from "../utils/formatEmissions";

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

export function Step2Score({
  footprint,
  gamify,
  habits,
  userDisplayName,
  onNext,
  onBack,
  onOpenToolkit,
  onOpenPortfolio,
}) {
  if (!footprint) return null;

  const tier = tierCopy[footprint.comparison?.relativeToUs] || tierCopy.average;
  const over = footprint.carbonBudget?.status !== "within";
  const targetAnnualKg = footprint.carbonBudget.targetAnnualKg;
  const targetWeeklyKg = footprint.carbonBudget.targetWeeklyKg ?? targetAnnualKg / 52;
  const weeklyKg = footprint.weeklyKgCO2e ?? footprint.annualKgCO2e / 52;
  const projectedAnnualKg = footprint.projectedAnnualKgCO2e ?? footprint.annualKgCO2e;
  const chg = footprint.changeFromLastWeek;
  const streak = footprint.streak;
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
        <h2 className="step-form__title">Your carbon score — this week</h2>
        <p className="step-form__lead">
          Weekly footprint from your check-in, benchmarks, and where emissions came from this week.
          Projected yearly ≈ {formatTonnesFromKg(projectedAnnualKg, 2)} t if every week looked like this.
        </p>

        <div className="score-hero">
          <RingGauge
            valueKg={weeklyKg}
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
                <span className="mini-stat__val">{formatTonnesFromKg(weeklyKg, 2)}</span>
                <span className="mini-stat__lbl">{UNIT_METRIC_TONNES_WK}</span>
              </div>
            </div>
            {streak != null && (
              <p className="score-hero__streak">
                Weekly log streak: <strong>{streak.currentWeeklyStreak}</strong> week
                {streak.currentWeeklyStreak === 1 ? "" : "s"}
                {streak.longestWeeklyStreak != null && streak.longestWeeklyStreak > 0
                  ? ` · best ${streak.longestWeeklyStreak}`
                  : ""}
              </p>
            )}
          </div>
        </div>

        {chg && (
          <div
            className={`weekly-delta ${chg.improved ? "weekly-delta--improved" : "weekly-delta--higher"}`}
            role="status"
          >
            <strong>vs last logged week:</strong>{" "}
            {chg.improved ? "Improved" : "Higher"} by{" "}
            {chg.percentChange != null ? `${Math.abs(chg.percentChange)}%` : "—"} (
            {formatTonnesFromKg(Math.abs(chg.weeklyKgDelta ?? 0), 2)} t CO₂e / week)
          </div>
        )}

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
              ~{formatTonnesFromKg(footprint.comparison.globalAverageWeeklyKg ?? footprint.comparison.globalAverageAnnualKg / 52, 2)}{" "}
              t / week
            </p>
            <p className="compare-card__hint">
              You are at <strong>{footprint.comparison.yourPercentOfGlobalAverage}%</strong> of the
              yearly benchmark (same ratio weekly).
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
              {formatTonnesFromKg(footprint.comparison.usAverageWeeklyKg ?? (footprint.comparison.usAverageAnnualKg ?? 14900) / 52, 2)}{" "}
              t / week
            </p>
            <p className="compare-card__hint">
              You are at <strong>{footprint.comparison.yourPercentOfUsAverage ?? "—"}%</strong> of
              the yearly US benchmark (same ratio weekly).
            </p>
          </motion.article>
        </div>

        <div className="budget-meter">
          <h3 className="section-heading">Carbon budget (this week)</h3>
          <p className="budget-meter__lede">
            This week vs a fair-share weekly slice of a global climate goal. Yearly projection:{" "}
            {formatTonnesFromKg(projectedAnnualKg, 2)} t / yr.
          </p>

          <div className="budget-meter__cards">
            <div className="budget-meter__card">
              <span className="budget-meter__card-label">This week</span>
              <span className="budget-meter__card-value">
                {formatTonnesFromKg(weeklyKg, 2)}
              </span>
              <span className="budget-meter__card-unit">{UNIT_METRIC_TONNES_WK}</span>
            </div>
            <div className="budget-meter__card budget-meter__card--target">
              <span className="budget-meter__card-label">Fair share (weekly)</span>
              <span className="budget-meter__card-value">
                ~{formatTonnesFromKg(targetWeeklyKg, 2)}
              </span>
              <span className="budget-meter__card-unit">{UNIT_METRIC_TONNES_WK}</span>
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
                ? `${formatTonnesFromKg(footprint.carbonBudget.remainingKg, 2)} t under your weekly fair-share slice — room to improve or stay steady.`
                : `${formatTonnesFromKg(footprint.carbonBudget.overBudgetKg, 2)} t over your weekly fair-share slice — prioritize high-impact cuts (travel, home, diet).`}
            </span>
          </div>
        </div>

        <div className="emissions-breakdown">
          <h3 className="emissions-breakdown__title">Emissions breakdown</h3>
          <p className="emissions-breakdown__sub">
            Share of this week’s footprint by category (metric tonnes CO₂e).
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
              <BreakdownDonut slices={breakdownSlices} totalKg={footprint.weeklyKgCO2e ?? weeklyKg} size={300} />
            </div>
          </div>
        </div>

        {gamify && (
          <ToolkitTeaser
            gamify={gamify}
            variant="score"
            onOpenToolkit={onOpenToolkit}
            onOpenPortfolio={onOpenPortfolio}
          />
        )}

        <div className="step-actions">
          <button type="button" className="btn-ghost" onClick={onBack}>
            ← Edit weekly check-in
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

        <CarbonScorePdfButton
          footprint={footprint}
          habits={habits}
          userDisplayName={userDisplayName}
        />
      </div>
    </motion.section>
  );
}
