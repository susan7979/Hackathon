import { useCallback, useEffect, useState } from "react";
import { ACHIEVEMENT_DEFS } from "../../data/xpAchievements";
import { AchievementRow } from "./AchievementRow";

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

/**
 * Full-screen overlay listing every achievement; tooltips open below rows so text stays readable while scrolling.
 */
export function AchievementsAllModal({ achievementStars, onClose }) {
  const touchFriendly = useTouchFriendlyTooltips();
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleRow = useCallback((id) => {
    setOpenId((cur) => (cur === id ? null : id));
  }, []);

  useEffect(() => {
    if (!touchFriendly || openId == null) return;
    const close = (e) => {
      if (!e.target.closest?.(".portfolio-achievement")) setOpenId(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [touchFriendly, openId]);

  const unlocked = ACHIEVEMENT_DEFS.filter((d) => (achievementStars[d.id] || 0) > 0).length;

  return (
    <div className="portfolio-modal-root" role="presentation">
      <button type="button" className="portfolio-modal-backdrop" aria-label="Close dialog" onClick={onClose} />
      <div
        className="portfolio-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-modal-title"
      >
        <div className="portfolio-modal-panel__head">
          <div>
            <h2 id="portfolio-modal-title" className="portfolio-modal-panel__title">
              All achievements
            </h2>
            <p className="portfolio-modal-panel__sub">
              {unlocked} of {ACHIEVEMENT_DEFS.length} unlocked · hover a row for star criteria (scroll inside this
              panel).
            </p>
          </div>
          <button type="button" className="portfolio-modal-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="portfolio-modal-panel__scroll">
          {ACHIEVEMENT_DEFS.map((def) => (
            <AchievementRow
              key={def.id}
              def={def}
              achievementStars={achievementStars}
              touchFriendly={touchFriendly}
              openId={openId}
              onToggle={toggleRow}
              tooltipPlacement="below"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
