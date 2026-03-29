import { xpSumForStars } from "../../data/xpAchievements";

/**
 * Single achievement row + criteria popover. `tooltipPlacement` avoids clipping: above in short cards, below in scroll modals.
 */
export function AchievementRow({
  def,
  achievementStars,
  touchFriendly,
  openId,
  onToggle,
  tooltipPlacement = "above",
}) {
  const n = achievementStars[def.id] || 0;
  const xpEarned = xpSumForStars(n, def);
  const locked = n === 0;
  const isOpen = touchFriendly && openId === def.id;

  return (
    <div
      role={touchFriendly ? "button" : undefined}
      tabIndex={0}
      className={`portfolio-achievement ${locked ? "portfolio-achievement--locked" : ""} ${isOpen ? "portfolio-achievement--tip-open" : ""} ${touchFriendly ? "portfolio-achievement--interactive" : ""}`}
      onClick={(e) => {
        if (!touchFriendly) return;
        e.stopPropagation();
        onToggle(def.id);
      }}
      onKeyDown={(e) => {
        if (!touchFriendly) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(def.id);
        }
      }}
    >
      <span className="portfolio-achievement__icon" aria-hidden>
        {def.icon}
      </span>
      <div className="portfolio-achievement__body">
        <h4>{def.title}</h4>
        <p>{def.starDesc[0]}</p>
        <div className="portfolio-achievement__stars" aria-label={`${n} of 3 stars`}>
          {[1, 2, 3].map((s) => (
            <span key={s} className={s <= n ? "portfolio-star portfolio-star--on" : "portfolio-star"}>
              ★
            </span>
          ))}
        </div>
      </div>
      <span className="portfolio-achievement__xp">{xpEarned} XP</span>
      <div
        className={`portfolio-achievement__tooltip portfolio-achievement__tooltip--${tooltipPlacement}`}
        role="tooltip"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="portfolio-achievement__tooltip-title">
          <strong>How to earn stars</strong>
        </p>
        {[0, 1, 2].map((i) => (
          <p key={i} className="portfolio-achievement__tooltip-line">
            {i + 1}★ — {def.starDesc[i]} <span className="portfolio-achievement__tooltip-xp">(+{def.starXp[i]} XP)</span>
          </p>
        ))}
        <p className="portfolio-achievement__tooltip-line">
          <strong>Category:</strong> {def.category}
        </p>
      </div>
    </div>
  );
}
