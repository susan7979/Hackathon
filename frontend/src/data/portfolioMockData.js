/**
 * Example payloads for Storybook/tests or offline demos — shape matches `userPortfolio.types.js`.
 * Replace with `GET /api/me/portfolio` when the backend exists.
 */

export const MOCK_PORTFOLIO_USER = {
  id: "demo-user-1",
  name: "Yasmin",
  displayName: "Yasmin",
  initials: "YA",
  totalXp: 420,
  level: 4,
  levelTitle: "Eco warrior",
  streakDays: 3,
  maxStreakDays: 5,
  annualKgCO2e: 6200,
  achievementStars: {
    first_footprint: 2,
    budget_hero: 1,
    benchmark: 1,
    hub_nomad: 2,
    pledge: 1,
  },
  badgesEarned: ["bdg_first_footprint", "bdg_budget_hero", "bdg_below_avg"],
};

export const MOCK_LEADERBOARD_XP_MODE = [
  { id: "1", name: "Alex K.", annualKg: 4200, totalXp: 5200, avatar: "◆" },
  { id: "2", name: "Jordan M.", annualKg: 5100, totalXp: 4800, avatar: "◇" },
  { id: "you", name: "You", annualKg: 6800, totalXp: 4200, avatar: "▣", isYou: true },
];
