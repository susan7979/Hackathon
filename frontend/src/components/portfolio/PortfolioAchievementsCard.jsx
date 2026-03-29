import { useCallback, useEffect, useMemo, useState } from "react";
import { ACHIEVEMENT_DEFS, xpSumForStars } from "../../data/xpAchievements";
import { PORTFOLIO_SHOWCASE_ACHIEVEMENT_IDS } from "../../data/portfolioShowcase";
import { AchievementRow } from "./AchievementRow";
import { AchievementsAllModal } from "./AchievementsAllModal";

function useTouchFriendlyTooltips() {
  const [touchFriendly, setTouchFriendly] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px), (hover: none), (pointer: coarse)");
    const sync = () => setTouchFriendly(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return touchFriendly;
}

function showcasedDefs() {
  return PORTFOLIO_SHOWCASE_ACHIEVEMENT_IDS.map((id) => ACHIEVEMENT_DEFS.find((d) => d.id === id)).filter(
    Boolean
  );
}

/**
 * Featured five achievements + button to open full list modal; tooltips above rows in the compact card.
 */
export function PortfolioAchievementsCard({ achievementStars }) {
  const defs = useMemo(() => showcasedDefs(), []);
  const unlocked = defs.filter((d) => (achievementStars[d.id] || 0) > 0).length;
  const allUnlocked = ACHIEVEMENT_DEFS.filter((d) => (achievementStars[d.id] || 0) > 0).length;
  const showcasedXp = useMemo(() => {
    let s = 0;
    for (const def of defs) {
      s += xpSumForStars(achievementStars[def.id] || 0, def);
    }
    return s;
  }, [defs, achievementStars]);

  const touchFriendly = useTouchFriendlyTooltips();
  const [openId, setOpenId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleRow = useCallback(
    (id) => {
      if (!touchFriendly) return;
      setOpenId((cur) => (cur === id ? null : id));
    },
    [touchFriendly]
  );

  useEffect(() => {
    if (!touchFriendly || openId == null) return;
    const close = (e) => {
      if (!e.target.closest?.(".portfolio-achievement")) setOpenId(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [touchFriendly, openId]);

  return (
    <section className="portfolio-card portfolio-card--fill portfolio-achievements-card">
      <div className="portfolio-card__head">
        <div>
          <h3 className="portfolio-card__title">Achievements</h3>
          <p className="portfolio-card__sub">
            {unlocked} of {defs.length} featured · <strong>{Math.round(showcasedXp)} XP</strong> from these ·{" "}
            {allUnlocked}/{ACHIEVEMENT_DEFS.length} total unlocked
          </p>
          {touchFriendly && (
            <p className="portfolio-card__sub portfolio-card__sub--hint">Tap a row for star criteria and XP.</p>
          )}
        </div>
      </div>
      <div className="portfolio-achievements-card__list">
        {defs.map((def) => (
          <AchievementRow
            key={def.id}
            def={def}
            achievementStars={achievementStars}
            touchFriendly={touchFriendly}
            openId={openId}
            onToggle={toggleRow}
            tooltipPlacement="above"
          />
        ))}
      </div>
      <div className="portfolio-achievements-card__footer">
        <button type="button" className="portfolio-achievements-card__open-all" onClick={() => setModalOpen(true)}>
          View all achievements ({ACHIEVEMENT_DEFS.length})
        </button>
      </div>
      {modalOpen && (
        <AchievementsAllModal achievementStars={achievementStars} onClose={() => setModalOpen(false)} />
      )}
    </section>
  );
}
