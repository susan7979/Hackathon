/** Mock community leaderboard — lower annual CO₂e (stored as kg in API) ranks higher */
export const MOCK_LEADERBOARD = [
  { id: "1", name: "Alex K.", annualKg: 4200, avatar: "🌿" },
  { id: "2", name: "Jordan M.", annualKg: 5100, avatar: "🚲" },
  { id: "3", name: "Sam R.", annualKg: 6800, avatar: "♻️" },
  { id: "4", name: "Taylor P.", annualKg: 8200, avatar: "🌍" },
  { id: "5", name: "Riley D.", annualKg: 9400, avatar: "🌱" },
];

export const WEEKLY_CHALLENGES = [
  {
    id: "walk5k",
    title: "Walk 5 km instead of a short drive",
    badge: "🚶",
    kgHint: "~0.001–0.002 t CO₂e",
  },
  {
    id: "plantmeal",
    title: "Eat one fully plant-based meal",
    badge: "🥗",
    kgHint: "~0.002–0.004 t CO₂e",
  },
  {
    id: "standby",
    title: "Unplug or switch off standby for one evening",
    badge: "💡",
    kgHint: "~0.0005 t CO₂e",
  },
  {
    id: "transit",
    title: "Take public transit or bike for one commute",
    badge: "🚌",
    kgHint: "~0.002–0.005 t CO₂e",
  },
];

export const ACHIEVEMENTS = [
  { id: "first_calc", title: "First footprint", desc: "Completed your first estimate", icon: "📊" },
  { id: "under_budget", title: "Budget hero", desc: "Came in under the demo carbon budget", icon: "🎯" },
  { id: "below_us", title: "Below US avg", desc: "Lower than illustrative US benchmark", icon: "🇺🇸" },
  { id: "streak_3", title: "3-day streak", desc: "Opened the app 3 days in a row", icon: "🔥" },
  { id: "pledge", title: "Pledger", desc: "Posted a public-style pledge", icon: "✋" },
  { id: "hub_explorer", title: "Hub explorer", desc: "Opened the Impact Hub", icon: "🧭" },
];

export const LOCAL_INITIATIVES = [
  {
    title: "Community tree planting weekend",
    type: "Trees",
    area: "Near you (demo)",
    url: "https://www.arborday.org",
  },
  {
    title: "Utility green power program",
    type: "Clean energy",
    area: "Check your utility website",
    url: "https://www.energy.gov",
  },
  {
    title: "Farmers market / low-packaging shops",
    type: "Sustainable shopping",
    area: "Local listings",
    url: "https://www.usda.gov/farmersmarket",
  },
];

export const OFFSET_MARKETPLACES = [
  { name: "Gold Standard (certified projects)", url: "https://www.goldstandard.org" },
  { name: "Verra registry", url: "https://verra.org" },
  { name: "Cool Effect", url: "https://www.cooleffect.org" },
];

export const TAX_INCENTIVE_HINTS = [
  "US: federal clean vehicle & home energy credits change by year — see IRS energy credits page.",
  "Many states offer rebates for heat pumps, solar, and weatherization — search “[your state] energy rebate”.",
  "Utility demand-response programs sometimes pay you to reduce peak electricity use.",
];

export const MOCK_FRIENDS = [
  { name: "Casey", annualKg: 7800 },
  { name: "Morgan", annualKg: 11200 },
  { name: "Jamie", annualKg: 9500 },
];

/** Preset “optimized” lifestyle for scenario comparison */
export const OPTIMIZED_SCENARIO_HABITS = {
  commute: { mode: "transit", kmPerDay: 12, daysPerWeek: 5 },
  flights: { shortHaulPerYear: 0, longHaulPerYear: 0 },
  diet: "vegetarian",
  shopping: { level: "low" },
  home: { kwhPerMonth: 220 },
};
