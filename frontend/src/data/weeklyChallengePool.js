/**
 * Pool of weekly micro-actions. IDs are stable for persistence / API sync.
 * `tags` drive achievement rules (e.g. transit_switcher).
 */
export const WEEKLY_CHALLENGE_POOL = [
  {
    id: "walk5k",
    title: "Walk 5 km instead of a short drive",
    description: "Replace a short car trip with walking when safe and practical.",
    badge: "🚶",
    kgHint: "~0.001–0.002 t CO₂e",
    baseXp: 22,
    tags: ["mobility"],
  },
  {
    id: "plantmeal",
    title: "Eat one fully plant-based meal",
    description: "One meal without meat or dairy.",
    badge: "🥗",
    kgHint: "~0.002–0.004 t CO₂e",
    baseXp: 22,
    tags: ["food", "plant"],
  },
  {
    id: "standby",
    title: "Unplug or switch off standby for one evening",
    description: "Remove phantom load from chargers and entertainment devices.",
    badge: "💡",
    kgHint: "~0.0005 t CO₂e",
    baseXp: 22,
    tags: ["energy"],
  },
  {
    id: "transit",
    title: "Take public transit or bike for one commute",
    description: "Swap a solo car commute for transit or cycling.",
    badge: "🚌",
    kgHint: "~0.002–0.005 t CO₂e",
    baseXp: 24,
    tags: ["transit"],
  },
  {
    id: "fastfashion",
    title: "Avoid a fast-fashion purchase for one week",
    description: "Pause impulse apparel buys; repair or swap instead.",
    badge: "👕",
    kgHint: "~varies",
    baseXp: 20,
    tags: ["consumption"],
  },
  {
    id: "reusable_bottle",
    title: "Use a reusable bottle all week",
    description: "Skip single-use drinks packaging.",
    badge: "💧",
    kgHint: "~small",
    baseXp: 18,
    tags: ["consumption"],
  },
  {
    id: "short_showers",
    title: "Take shorter showers for three days",
    description: "Aim for a few minutes less hot water each day.",
    badge: "🚿",
    kgHint: "~0.0003 t CO₂e",
    baseXp: 20,
    tags: ["energy"],
  },
  {
    id: "cold_wash",
    title: "Wash clothes in cold water",
    description: "One laundry cycle on cold saves heating energy.",
    badge: "🌀",
    kgHint: "~0.0002 t CO₂e",
    baseXp: 18,
    tags: ["energy"],
  },
  {
    id: "no_car_day",
    title: "Have one no-car day",
    description: "Plan a day without driving if alternatives exist.",
    badge: "—",
    kgHint: "~0.001–0.003 t CO₂e",
    baseXp: 22,
    tags: ["mobility", "transit"],
  },
  {
    id: "byo_container",
    title: "Bring your own bag, cup, or container",
    description: "Avoid disposable packaging on one shop or café run.",
    badge: "🛍️",
    kgHint: "~small",
    baseXp: 18,
    tags: ["consumption"],
  },
  {
    id: "hvac_trim",
    title: "Reduce AC or heating intensity for one day",
    description: "Adjust thermostat or dress for the season.",
    badge: "🌡️",
    kgHint: "~0.0005 t CO₂e",
    baseXp: 20,
    tags: ["energy"],
  },
  {
    id: "sustainable_brand",
    title: "Buy one item from a sustainable partner brand",
    description: "Support a vetted low-impact product when you need something.",
    badge: "🌿",
    kgHint: "~varies",
    baseXp: 22,
    tags: ["consumption"],
  },
];

const byId = Object.fromEntries(WEEKLY_CHALLENGE_POOL.map((c) => [c.id, c]));

export function getChallengeDefById(id) {
  return byId[id] || null;
}

export function countClaimsForTag(xpWeeklyClaims, tag) {
  const ids = new Set(
    WEEKLY_CHALLENGE_POOL.filter((c) => (c.tags || []).includes(tag)).map((c) => c.id)
  );
  let n = 0;
  if (!xpWeeklyClaims || typeof xpWeeklyClaims !== "object") return 0;
  for (const week of Object.values(xpWeeklyClaims)) {
    if (!week || typeof week !== "object") continue;
    for (const id of Object.keys(week)) {
      if (ids.has(id)) n += 1;
    }
  }
  return n;
}
