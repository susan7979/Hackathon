import { formatTonnesFromKg, UNIT_T_CO2E_YR } from "../../utils/formatEmissions";
import { getLevelTitle } from "../../utils/xpLevel";

/**
 * Dense KPI grid — mirrors what a backend `UserProgressSummary` DTO would return.
 */
export function PortfolioProgressSummary({
  level,
  totalXp,
  achievementUnlockedCount,
  achievementTotalCount,
  totalStars,
  weeklyDone,
  weeklyTotal,
  streakCurrent,
  streakLongest,
  badgeCount,
  annualKg,
}) {
  const cells = [
    {
      label: "Current level",
      value: `${level}`,
      hint: getLevelTitle(level),
    },
    {
      label: "Total XP",
      value: `${Math.round(totalXp)}`,
      hint: "Lifetime",
    },
    {
      label: "Achievements",
      value: `${achievementUnlockedCount} / ${achievementTotalCount}`,
      hint: "With any stars",
    },
    {
      label: "Stars earned",
      value: `${totalStars}`,
      hint: "Across achievements",
    },
    {
      label: "This week",
      value: `${weeklyDone} / ${weeklyTotal}`,
      hint: "Weekly challenges",
    },
    {
      label: "Visit streak",
      value: `${streakCurrent} days`,
      hint: "Opens app daily",
    },
    {
      label: "Longest streak",
      value: `${streakLongest} days`,
      hint: "Personal best",
    },
    {
      label: "Badges",
      value: `${badgeCount}`,
      hint: "Of 5 featured",
    },
    {
      label: "Footprint",
      value: annualKg != null ? formatTonnesFromKg(annualKg, 2) : "—",
      hint: annualKg != null ? UNIT_T_CO2E_YR : "Run calculator",
    },
  ];

  return (
    <section className="portfolio-card">
      <div className="portfolio-card__head">
        <div>
          <h3 className="portfolio-card__title">Progress summary</h3>
          <p className="portfolio-card__sub">Your activity at a glance — ready to map to API fields.</p>
        </div>
      </div>
      <div className="portfolio-summary-grid">
        {cells.map((c) => (
          <div key={c.label} className="portfolio-summary-cell">
            <div className="portfolio-summary-cell__label">{c.label}</div>
            <div className="portfolio-summary-cell__value">{c.value}</div>
            <div className="portfolio-summary-cell__hint">{c.hint}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
