/**
 * Star tiers: 1–3 stars per achievement. Higher stars award more XP (index 0 = 1 star).
 * Conditions evaluated in `evaluateAchievementStars` using gamify aggregate state.
 */
export const ACHIEVEMENT_DEFS = [
  {
    id: "first_footprint",
    title: "First footprint",
    icon: "📊",
    starDesc: [
      "Complete your first carbon estimate",
      "Maintain a 7+ day visit streak",
      "Maintain a 21+ day visit streak",
    ],
    starXp: [40, 100, 220],
  },
  {
    id: "budget_hero",
    title: "Budget hero",
    icon: "🎯",
    starDesc: [
      "Come in under your fair-share carbon budget",
      "Stay under budget with a 5+ day streak",
      "Stay under budget with a 14+ day streak",
    ],
    starXp: [45, 110, 240],
  },
  {
    id: "benchmark",
    title: "Below benchmark",
    icon: "🇺🇸",
    starDesc: [
      "Beat the illustrative US average",
      "Stay below US avg with a 5+ day streak",
      "Stay below avg and explore the marketplace",
    ],
    starXp: [40, 100, 220],
  },
  {
    id: "ember_streak",
    title: "Ember streak",
    icon: "🔥",
    starDesc: ["3-day visit streak", "7-day visit streak", "21-day visit streak"],
    starXp: [35, 90, 200],
  },
  {
    id: "pledge",
    title: "Community voice",
    icon: "✋",
    starDesc: ["Post a pledge", "3 pledges in the hub", "6 pledges total"],
    starXp: [35, 95, 210],
  },
  {
    id: "hub_nomad",
    title: "Toolkit explorer",
    icon: "🧭",
    starDesc: ["Open the Impact Hub", "Visit 2+ toolkit sections", "Visit all 4 toolkit tabs"],
    starXp: [40, 100, 230],
  },
  {
    id: "marketplace",
    title: "Sustainable shopper",
    icon: "🛒",
    starDesc: [
      "Open the Sustainable marketplace step",
      "Return to the marketplace 3+ times",
      "Visit the marketplace 8+ times",
    ],
    starXp: [35, 90, 200],
  },
  {
    id: "offsets",
    title: "Offset champion",
    icon: "🌿",
    starDesc: [
      "Select a carbon offset project",
      "Keep an offset selected with a 7+ day streak",
      "Offset + complete 4+ weekly challenge check-ins",
    ],
    starXp: [45, 115, 250],
  },
  {
    id: "challenges",
    title: "Challenge grinder",
    icon: "✅",
    starDesc: [
      "Complete 1 weekly challenge (check-in)",
      "4+ challenge check-ins total",
      "12+ challenge check-ins total",
    ],
    starXp: [40, 100, 220],
  },
];

export function xpSumForStars(starCount, def) {
  let sum = 0;
  const n = Math.min(3, Math.max(0, starCount | 0));
  for (let i = 0; i < n; i++) sum += def.starXp[i] ?? 0;
  return sum;
}

export function totalXpFromAchievementStars(achievementStars) {
  let total = 0;
  for (const def of ACHIEVEMENT_DEFS) {
    const s = achievementStars?.[def.id] ?? 0;
    total += xpSumForStars(s, def);
  }
  return total;
}

/**
 * @param {object} ctx
 * @param {number|null|undefined} ctx.footprintKg
 * @param {string|undefined} ctx.budgetStatus — "within" | "over"
 * @param {string|undefined} ctx.relativeToUs — "below_average" | ...
 * @param {number} ctx.streak
 * @param {number} ctx.pledgeCount
 * @param {number} ctx.marketplaceVisits
 * @param {number} ctx.hubTabsVisitedCount
 * @param {boolean} ctx.offsetSelected
 * @param {number} ctx.weeklyChallengeCheckIns — total check-ins recorded (any week)
 */
export function countChallengeCheckIns(xpWeeklyClaims) {
  if (!xpWeeklyClaims || typeof xpWeeklyClaims !== "object") return 0;
  let n = 0;
  for (const w of Object.values(xpWeeklyClaims)) {
    if (w && typeof w === "object") n += Object.keys(w).length;
  }
  return n;
}

export function evaluateAchievementStars(ctx) {
  const fp = ctx.footprintKg != null && !Number.isNaN(Number(ctx.footprintKg));
  const streak = Math.max(0, Number(ctx.streak) || 0);
  const within = ctx.budgetStatus === "within";
  const belowUs = ctx.relativeToUs === "below_average";
  const pledges = Math.max(0, Number(ctx.pledgeCount) || 0);
  const mp = Math.max(0, Number(ctx.marketplaceVisits) || 0);
  const hubTabs = Math.max(0, Number(ctx.hubTabsVisitedCount) || 0);
  const offset = Boolean(ctx.offsetSelected);
  const claims = Math.max(0, Number(ctx.weeklyChallengeCheckIns) || 0);

  const stars = {};

  stars.first_footprint = fp ? (streak >= 21 ? 3 : streak >= 7 ? 2 : 1) : 0;

  stars.budget_hero = !fp
    ? 0
    : !within
      ? 0
      : streak >= 14
        ? 3
        : streak >= 5
          ? 2
          : 1;

  stars.benchmark = !fp || !belowUs ? 0 : mp >= 1 ? 3 : streak >= 5 ? 2 : 1;

  stars.ember_streak = streak >= 21 ? 3 : streak >= 7 ? 2 : streak >= 3 ? 1 : 0;

  stars.pledge = pledges >= 6 ? 3 : pledges >= 3 ? 2 : pledges >= 1 ? 1 : 0;

  stars.hub_nomad = hubTabs >= 4 ? 3 : hubTabs >= 2 ? 2 : hubTabs >= 1 ? 1 : 0;

  stars.marketplace = mp >= 8 ? 3 : mp >= 3 ? 2 : mp >= 1 ? 1 : 0;

  stars.offsets =
    !offset ? 0 : claims >= 4 && streak >= 7 ? 3 : streak >= 7 ? 2 : 1;

  stars.challenges = claims >= 12 ? 3 : claims >= 4 ? 2 : claims >= 1 ? 1 : 0;

  return stars;
}

/** Map legacy v1 badge ids to minimum stars on new achievements (migration). */
export const LEGACY_BADGE_STARS = {
  first_calc: { first_footprint: 1 },
  under_budget: { budget_hero: 1 },
  below_us: { benchmark: 1 },
  streak_3: { ember_streak: 1 },
  pledge: { pledge: 1 },
  hub_explorer: { hub_nomad: 1 },
};
