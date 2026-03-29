import { isoWeekKey } from "../../hooks/useGamification";
import { formatIsoWeekRangeDisplay, weeklyChallengesXpTotal } from "../../utils/portfolioBusinessLogic";

/**
 * Weekly challenges bound to `gamify.weeklyChallengeRows` and persisted claims.
 */
export function PortfolioWeeklyCard({ gamify }) {
  const wk = isoWeekKey();
  const rows = gamify.weeklyChallengeRows || [];
  const totalWeekXp = weeklyChallengesXpTotal(wk, gamify.xpWeeklyClaims);
  const done = rows.filter((r) => r.completed).length;

  return (
    <section className="portfolio-card portfolio-card--fill portfolio-weekly-card">
      <div className="portfolio-weekly__meta">
        <div>
          <h3 className="portfolio-card__title" style={{ marginBottom: "0.15rem" }}>
            Weekly challenges
          </h3>
          <p className="portfolio-card__sub">{formatIsoWeekRangeDisplay(wk)}</p>
        </div>
        <span className="portfolio-pill" title="Daily visits to the app">
          <span aria-hidden>▴</span> {gamify.streak || 0}-day visit streak
        </span>
      </div>
      <p className="portfolio-card__sub" style={{ marginTop: "0.5rem" }}>
        Check-ins save locally; XP uses your visit-streak bonus (3d +5% → 30d +25%).
      </p>
      <div className="portfolio-weekly-card__body">
        {rows.length === 0 ? (
          <p className="portfolio-empty">No challenges loaded for this week.</p>
        ) : (
          rows.map((c) => (
            <label key={c.id} className="portfolio-weekly-item" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={Boolean(c.completed)}
                onChange={() => gamify.toggleChallenge(c.id)}
                className="portfolio-weekly-item__input"
              />
              <div>
                <strong>{c.title}</strong>
                <div className="portfolio-card__sub" style={{ marginTop: "0.15rem" }}>
                  {c.description} · ~{c.estimatedCo2Label}
                </div>
              </div>
              <span className="portfolio-weekly-item__xp">
                {c.completed ? `+${c.xpReward} XP` : `~${c.baseXp} XP`}
              </span>
            </label>
          ))
        )}
      </div>
      <div className="portfolio-weekly-footer">
        <strong>Total this week: +{totalWeekXp} XP</strong> · {done}/{rows.length || 4} completed
        {done === rows.length && rows.length > 0 ? " — nice momentum." : ""}
      </div>
    </section>
  );
}
