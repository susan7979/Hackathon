import { motion } from "framer-motion";
import { PORTFOLIO_SHOWCASE_ACHIEVEMENT_IDS } from "../../data/portfolioShowcase";
import { portfolioXpSnapshot, countPerfectChallengeWeeks, totalStarsEarned } from "../../utils/portfolioBusinessLogic";
import { PortfolioAchievementsCard } from "./PortfolioAchievementsCard";
import { PortfolioHeroCard } from "./PortfolioHeroCard";
import { PortfolioLeaderboardSection } from "./PortfolioLeaderboardSection";
import { PortfolioProgressSummary } from "./PortfolioProgressSummary";
import { PortfolioWeeklyCard } from "./PortfolioWeeklyCard";
import "./portfolio.css";

function displayName(user) {
  return user?.displayName || user?.name || user?.email?.split("@")[0] || "Member";
}

function initialsFromUser(user) {
  const n = displayName(user);
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return n.slice(0, 2).toUpperCase() || "?";
}

/**
 * Full portfolio route: composes reusable cards; state comes from `useGamification` + auth + footprint.
 */
export function UserPortfolioPage({ user, footprint, gamify, onBack }) {
  const xpSnapshot = portfolioXpSnapshot(gamify.totalXp ?? 0);
  const stars = gamify.achievementStars || {};
  const unlockedShowcase = PORTFOLIO_SHOWCASE_ACHIEVEMENT_IDS.filter((id) => (stars[id] || 0) > 0).length;
  const totalStars = totalStarsEarned(stars);
  const perfectWeeks = countPerfectChallengeWeeks(gamify.weeklySlots, gamify.weeklyDone);
  const rows = gamify.weeklyChallengeRows || [];
  const weeklyDone = rows.filter((r) => r.completed).length;

  const headerUser = {
    displayName: displayName(user),
    initials: initialsFromUser(user),
  };

  return (
    <motion.div
      className="portfolio-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <button type="button" className="portfolio-page__back" onClick={onBack}>
        ← Back to flow
      </button>

      <PortfolioHeroCard user={headerUser} xpSnapshot={xpSnapshot} achievementStars={stars} />

      <div className="portfolio-grid-2">
        <PortfolioAchievementsCard achievementStars={stars} />
        <PortfolioWeeklyCard gamify={gamify} />
      </div>

      <PortfolioLeaderboardSection
        user={user}
        footprintKg={footprint?.annualKgCO2e}
        totalXp={gamify.totalXp}
      />

      <PortfolioProgressSummary
        level={gamify.level ?? 1}
        totalXp={gamify.totalXp ?? 0}
        achievementUnlockedCount={unlockedShowcase}
        achievementTotalCount={PORTFOLIO_SHOWCASE_ACHIEVEMENT_IDS.length}
        totalStars={totalStars}
        weeklyDone={weeklyDone}
        weeklyTotal={rows.length || 4}
        streakCurrent={gamify.streak ?? 0}
        streakLongest={gamify.maxStreak ?? 0}
        badgeCount={unlockedShowcase}
        annualKg={footprint?.annualKgCO2e}
      />
    </motion.div>
  );
}
