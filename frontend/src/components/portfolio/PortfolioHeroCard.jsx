/**
 * Profile + XP progress + five fixed showcase badges in one card (reference layout).
 */
function IconBars() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 20V10M12 20V4M19 20v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconUS() {
  return (
    <span className="portfolio-showcase-badge__us-text" aria-hidden>
      US
    </span>
  );
}

function IconCompass() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function IconPledge() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4c-2 2.5-6 4.5-6 9a6 6 0 1012 0c0-4.5-4-6.5-6-9z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 14h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

const SHOWCASE_BADGES = [
  { achievementId: "first_footprint", title: "First footprint", Icon: IconBars },
  { achievementId: "budget_hero", title: "Budget hero", Icon: IconTarget },
  { achievementId: "benchmark", title: "Below US avg", Icon: IconUS },
  { achievementId: "hub_nomad", title: "Hub explorer", Icon: IconCompass },
  { achievementId: "pledge", title: "Pledger", Icon: IconPledge },
];

export function PortfolioHeroCard({ user, xpSnapshot, achievementStars }) {
  const nextCap = xpSnapshot.nextLevelXp;
  const pct = Math.round((xpSnapshot.progressFraction || 0) * 100);

  return (
    <div className="portfolio-card portfolio-hero-card">
      <div className="portfolio-hero-card__main">
        <div className="portfolio-header__who">
          <div className="portfolio-header__avatar" aria-hidden>
            {user.initials}
          </div>
          <div className="portfolio-hero-card__identity">
            <h2 className="portfolio-header__name">{user.displayName}</h2>
            <p className="portfolio-header__titleline">
              <strong>{xpSnapshot.title}</strong>
              <span> · Level {xpSnapshot.level}</span>
            </p>
            <div className="portfolio-xp-block">
              <div
                className="portfolio-xp-bar"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="portfolio-xp-bar__fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="portfolio-xp-bar__labels">
                <span>{xpSnapshot.totalXp} XP</span>
                <span>{nextCap != null ? `${nextCap} XP next tier` : "Max level"}</span>
              </div>
              <p className="portfolio-xp-next">
                {nextCap != null ? (
                  <>
                    <strong>{xpSnapshot.xpRemaining}</strong> XP to reach level {xpSnapshot.level + 1}{" "}
                    <span style={{ opacity: 0.85 }}>({pct}% through this level band)</span>
                  </>
                ) : (
                  "You’ve reached the top display tier — keep logging impact."
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="portfolio-showcase-badges" aria-label="Badges earned">
          <p className="portfolio-showcase-badges__label">Badges earned</p>
          <div className="portfolio-showcase-badges__grid">
            {SHOWCASE_BADGES.map(({ achievementId, title, Icon }) => {
              const earned = (achievementStars?.[achievementId] || 0) >= 1;
              return (
                <div
                  key={achievementId}
                  className={`portfolio-showcase-badge ${earned ? "portfolio-showcase-badge--on" : "portfolio-showcase-badge--off"}`}
                  title={earned ? `${title} — unlocked` : `${title} — locked`}
                >
                  <span className="portfolio-showcase-badge__icon">
                    <Icon />
                  </span>
                  <span className="portfolio-showcase-badge__title">{title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
