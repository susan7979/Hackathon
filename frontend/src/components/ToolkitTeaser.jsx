import { motion } from "framer-motion";

/** Compact strip + CTA to open the toolkit (step 4) or scroll to #carbon-toolkit when embedded */
export function ToolkitTeaser({ gamify, variant = "default", onOpenToolkit }) {
  const n = (gamify.badges || []).length;
  const lvl = gamify.level ?? 1;
  const txp = Math.round(gamify.totalXp ?? 0);

  function handleOpen() {
    if (onOpenToolkit) onOpenToolkit();
    else
      document.getElementById("carbon-toolkit")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <motion.div
      className={`toolkit-teaser toolkit-teaser--${variant}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="toolkit-teaser__inner">
        <div className="toolkit-teaser__stats">
          <span title="Visit streak">🔥 {gamify.streak ?? 0}d streak</span>
          <span title="Level">
            Lv {lvl}
          </span>
          <span title="Experience points">{txp} XP</span>
          <span title="Badges unlocked">{n} badges</span>
        </div>
        <button
          type="button"
          className="btn-cta btn-cta--small toolkit-teaser__btn"
          onClick={handleOpen}
        >
          {onOpenToolkit ? "Open toolkit →" : "Open full toolkit ↓"}
        </button>
      </div>
      <p className="toolkit-teaser__hint">
        {onOpenToolkit
          ? "Challenges, leaderboard, what-if, AI coach, savings, and exports — on the next step."
          : "Challenges, leaderboard, what-if simulator, forecasts, pledges, AI coach, savings, heatmap, export — all below."}
      </p>
    </motion.div>
  );
}
