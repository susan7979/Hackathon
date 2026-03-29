import { countClaimsForTag } from "./weeklyChallengePool";

/**
 * Star tiers: 1–3 stars per achievement. Higher stars award more XP (index 0 = 1 star).
 * Conditions evaluated in `evaluateAchievementStars` using gamify aggregate state.
 */
export const ACHIEVEMENT_DEFS = [
  {
    id: "first_footprint",
    title: "First footprint",
    category: "Footprint",
    icon: "▣",
    starDesc: [
      "Complete your first carbon estimate",
      "Log in 7+ different days after your first estimate",
      "Log in 21+ different days after your first estimate",
    ],
    starXp: [40, 100, 220],
  },
  {
    id: "budget_hero",
    title: "Budget hero",
    category: "Footprint",
    icon: "◎",
    starDesc: [
      "Come in under your fair-share carbon budget once",
      "Stay under budget with a 5+ day visit streak",
      "Stay under budget with a 14+ day visit streak",
    ],
    starXp: [45, 110, 240],
  },
  {
    id: "benchmark",
    title: "Below US average",
    category: "Footprint",
    icon: "◇",
    starDesc: [
      "Beat the illustrative US average once",
      "Stay below US avg with a 5+ day visit streak",
      "Stay below avg and explore the marketplace",
    ],
    starXp: [40, 100, 220],
  },
  {
    id: "ember_streak",
    title: "Streak builder",
    category: "Habits",
    icon: "▴",
    starDesc: ["3-day visit streak", "7-day visit streak", "21-day visit streak"],
    starXp: [35, 90, 200],
  },
  {
    id: "pledge",
    title: "Pledger",
    category: "Community",
    icon: "✋",
    starDesc: ["Create your first pledge", "3 pledges in the hub", "6 pledges total"],
    starXp: [35, 95, 210],
  },
  {
    id: "hub_nomad",
    title: "Hub explorer",
    category: "Exploration",
    icon: "⌖",
    starDesc: [
      "Open the carbon toolkit once",
      "Visit both toolkit sections",
      "Visit both Predict & Social (full exploration)",
    ],
    starXp: [40, 100, 230],
  },
  {
    id: "marketplace",
    title: "Sustainable shopper",
    category: "Exploration",
    icon: "◫",
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
    category: "Action",
    icon: "◆",
    starDesc: [
      "Select a carbon offset project",
      "Keep an offset selected with a 7+ day visit streak",
      "Offset + complete 4+ weekly challenge check-ins",
    ],
    starXp: [45, 115, 250],
  },
  {
    id: "challenges",
    title: "Weekly finisher",
    category: "Challenges",
    icon: "✓",
    starDesc: [
      "Complete 1 weekly challenge check-in",
      "4+ challenge check-ins total",
      "12+ challenge check-ins total",
    ],
    starXp: [40, 100, 220],
  },
  {
    id: "transit_switcher",
    title: "Transit switcher",
    category: "Mobility",
    icon: "→",
    starDesc: [
      "Complete one transit / no-car style weekly challenge",
      "4+ transit-related weekly check-ins",
      "10+ transit-related weekly check-ins",
    ],
    starXp: [38, 95, 215],
  },
  {
    id: "plant_based",
    title: "Plant-based starter",
    category: "Food",
    icon: "◇",
    starDesc: [
      "Complete one plant-based meal weekly challenge",
      "3+ plant-meal weekly check-ins",
      "8+ plant-meal weekly check-ins",
    ],
    starXp: [36, 92, 205],
  },
  {
    id: "power_saver",
    title: "Power saver",
    category: "Home",
    icon: "○",
    starDesc: [
      "Complete one energy weekly challenge (standby, cold wash, HVAC…)",
      "4+ energy-themed weekly check-ins",
      "10+ energy-themed weekly check-ins",
    ],
    starXp: [36, 92, 205],
  },
  {
    id: "community_helper",
    title: "Community helper",
    category: "Community",
    icon: "◎",
    starDesc: ["1 pledge shared", "5 pledges total", "12 pledges total"],
    starXp: [30, 85, 195],
  },
  {
    id: "carbon_cutter",
    title: "Carbon cutter",
    category: "Footprint",
    icon: "▼",
    starDesc: [
      "Annual footprint under ~8 t CO₂e (demo threshold)",
      "Under ~6 t CO₂e",
      "Under ~4.5 t CO₂e",
    ],
    starXp: [42, 105, 235],
  },
  {
    id: "consistency_champ",
    title: "Consistency champ",
    category: "Habits",
    icon: "≡",
    starDesc: ["Longest visit streak 7+ days", "14+ days", "30+ days"],
    starXp: [40, 102, 225],
  },
  {
    id: "early_adopter",
    title: "Early adopter",
    category: "Milestone",
    icon: "★",
    starDesc: [
      "Reach 200 lifetime XP in CUTThecarbon",
      "Reach 800 lifetime XP",
      "Reach 2,000 lifetime XP",
    ],
    starXp: [25, 70, 160],
  },
  {
    id: "weekly_perfect",
    title: "Weekly perfectionist",
    category: "Challenges",
    icon: "✓",
    starDesc: [
      "Complete all four weekly slots in one ISO week",
      "3+ perfect weeks total",
      "8+ perfect weeks total",
    ],
    starXp: [45, 115, 255],
  },
  {
    id: "footprint_reducer",
    title: "Footprint reducer",
    category: "Footprint",
    icon: "⌁",
    starDesc: [
      "Below US avg + 5+ weekly challenge check-ins",
      "Below US avg + 12+ check-ins",
      "Below budget + below US avg + 20+ check-ins",
    ],
    starXp: [38, 98, 218],
  },
];

function countPerfectWeeksFromState(weeklySlots, weeklyDone) {
  if (!weeklySlots || typeof weeklySlots !== "object") return 0;
  let n = 0;
  for (const wk of Object.keys(weeklySlots)) {
    const slots = weeklySlots[wk];
    const done = weeklyDone?.[wk] || {};
    if (!Array.isArray(slots) || slots.length < 4) continue;
    if (slots.every((id) => done[id])) n += 1;
  }
  return n;
}

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

/** XP from achievements only, excluding one id (avoids circular rules like early_adopter). */
export function totalXpFromAchievementStarsExcept(achievementStars, excludeId) {
  let total = 0;
  for (const def of ACHIEVEMENT_DEFS) {
    if (def.id === excludeId) continue;
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
 * @param {number} ctx.maxStreak
 * @param {number} ctx.pledgeCount
 * @param {number} ctx.marketplaceVisits
 * @param {number} ctx.hubTabsVisitedCount
 * @param {boolean} ctx.offsetSelected
 * @param {number} ctx.weeklyChallengeCheckIns — total check-ins recorded (any week)
 * @param {Record<string, Record<string, number>>} [ctx.xpWeeklyClaims]
 * @param {Record<string, string[]>} [ctx.weeklySlots]
 * @param {Record<string, Record<string, boolean>>} [ctx.weeklyDone]
 * @param {number} [ctx.earlyAdopterBasisXp] — total XP excluding early_adopter achievement (see hook).
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
  const fpKg = Number(ctx.footprintKg);
  const fp = ctx.footprintKg != null && !Number.isNaN(fpKg);
  const streak = Math.max(0, Number(ctx.streak) || 0);
  const maxStreak = Math.max(streak, Number(ctx.maxStreak) || 0);
  const within = ctx.budgetStatus === "within";
  const belowUs = ctx.relativeToUs === "below_average";
  const pledges = Math.max(0, Number(ctx.pledgeCount) || 0);
  const mp = Math.max(0, Number(ctx.marketplaceVisits) || 0);
  const hubTabs = Math.max(0, Number(ctx.hubTabsVisitedCount) || 0);
  const offset = Boolean(ctx.offsetSelected);
  const claims = Math.max(0, Number(ctx.weeklyChallengeCheckIns) || 0);
  const claimsObj = ctx.xpWeeklyClaims || {};
  const transitN = countClaimsForTag(claimsObj, "transit");
  const plantN = countClaimsForTag(claimsObj, "plant");
  const energyN = countClaimsForTag(claimsObj, "energy");
  const perfectWeeks = countPerfectWeeksFromState(ctx.weeklySlots, ctx.weeklyDone);
  const earlyBasis = Math.max(0, Number(ctx.earlyAdopterBasisXp) || 0);

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

  /* Toolkit: Predict + Social (2 tabs). 1★ first visit; 3★ after both sections. */
  stars.hub_nomad = hubTabs >= 2 ? 3 : hubTabs >= 1 ? 1 : 0;

  stars.marketplace = mp >= 8 ? 3 : mp >= 3 ? 2 : mp >= 1 ? 1 : 0;

  stars.offsets =
    !offset ? 0 : claims >= 4 && streak >= 7 ? 3 : streak >= 7 ? 2 : 1;

  stars.challenges = claims >= 12 ? 3 : claims >= 4 ? 2 : claims >= 1 ? 1 : 0;

  stars.transit_switcher = transitN >= 10 ? 3 : transitN >= 4 ? 2 : transitN >= 1 ? 1 : 0;

  stars.plant_based = plantN >= 8 ? 3 : plantN >= 3 ? 2 : plantN >= 1 ? 1 : 0;

  stars.power_saver = energyN >= 10 ? 3 : energyN >= 4 ? 2 : energyN >= 1 ? 1 : 0;

  stars.community_helper = pledges >= 12 ? 3 : pledges >= 5 ? 2 : pledges >= 1 ? 1 : 0;

  stars.carbon_cutter = !fp
    ? 0
    : fpKg < 4500
      ? 3
      : fpKg < 6000
        ? 2
        : fpKg < 8000
          ? 1
          : 0;

  stars.consistency_champ = maxStreak >= 30 ? 3 : maxStreak >= 14 ? 2 : maxStreak >= 7 ? 1 : 0;

  stars.early_adopter = earlyBasis >= 2000 ? 3 : earlyBasis >= 800 ? 2 : earlyBasis >= 200 ? 1 : 0;

  stars.weekly_perfect = perfectWeeks >= 8 ? 3 : perfectWeeks >= 3 ? 2 : perfectWeeks >= 1 ? 1 : 0;

  stars.footprint_reducer = !fp || !belowUs
    ? 0
    : within && claims >= 20
      ? 3
      : claims >= 12
        ? 2
        : claims >= 5
          ? 1
          : 0;

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
