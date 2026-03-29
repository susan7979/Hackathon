/**
 * Weekly carbon footprint — core unit is kg CO₂e per week.
 * Projected annual = weekly × 52 (steady-state extrapolation).
 */
const factors = require("../data/emissionFactors.json");

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Monday–Sunday range + ISO week key (aligned with frontend `isoWeekKey`). */
function getWeekRange(date = new Date()) {
  const mon = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = mon.getUTCDay() || 7;
  mon.setUTCDate(mon.getUTCDate() + 1 - dow);
  const weekStart = mon.toISOString().slice(0, 10);
  const sun = new Date(mon);
  sun.setUTCDate(sun.getUTCDate() + 6);
  const weekEnd = sun.toISOString().slice(0, 10);

  const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t - y0) / 86400000 + 1) / 7);
  const weekKey = `${t.getUTCFullYear()}-W${String(w).padStart(2, "0")}`;
  return { weekStart, weekEnd, weekKey };
}

function legacyToWeeklyHabits(data) {
  if (!data || typeof data !== "object") return {};
  const hasWeekly =
    data.commute?.commuteKmThisWeek != null ||
    data.home?.kwhThisWeek != null ||
    data.flights?.shortHaulThisWeek != null ||
    data.flights?.longHaulThisWeek != null;

  if (hasWeekly) {
    const c = data.commute || {};
    const f = data.flights || {};
    const h = data.home || {};
    let commuteKmThisWeek = Math.max(0, num(c.commuteKmThisWeek, 0));
    if (c.commuteKmThisWeek == null) {
      const kmPerDay = num(c.kmPerDay, 0);
      const daysPerWeek = Math.min(7, Math.max(0, num(c.daysPerWeek, 5)));
      commuteKmThisWeek = kmPerDay * daysPerWeek;
    }
    return {
      ...data,
      commute: {
        mode: String(c.mode || "car").toLowerCase(),
        commuteKmThisWeek,
      },
      flights: {
        shortHaulThisWeek: Math.max(0, num(f.shortHaulThisWeek, 0)),
        longHaulThisWeek: Math.max(0, num(f.longHaulThisWeek, 0)),
      },
      home: { kwhThisWeek: Math.max(0, num(h.kwhThisWeek, 0)) },
    };
  }

  if (data.commute || data.flights !== undefined || data.shopping || data.home) {
    const c = data.commute || {};
    const mode = String(c.mode || "car").toLowerCase();
    const kmPerDay = num(c.kmPerDay, 0);
    const daysPerWeek = Math.min(7, Math.max(0, num(c.daysPerWeek, 5)));
    const commuteKmThisWeek = kmPerDay * daysPerWeek;

    const f = data.flights || {};
    const shortHaulThisWeek = num(f.shortHaulPerYear, 0) / 52;
    const longHaulThisWeek = num(f.longHaulPerYear, 0) / 52;

    const home = data.home || {};
    const kwhThisWeek = home.kwhThisWeek != null ? num(home.kwhThisWeek, 0) : (num(home.kwhPerMonth, 0) * 12) / 52;

    return {
      ...data,
      commute: { mode, commuteKmThisWeek },
      flights: { shortHaulThisWeek, longHaulThisWeek },
      home: { kwhThisWeek },
    };
  }

  const miles = num(data.milesDriven, 0);
  const milesPerWeek = miles / 52;
  const dietMap = { meat: "meat_heavy", vegetarian: "vegetarian", vegan: "vegan" };
  const dietKey = dietMap[String(data.diet || "").toLowerCase()] || "average";
  return {
    commute: { mode: "car", commuteKmThisWeek: milesPerWeek * 1.60934 },
    flights: { shortHaulThisWeek: 0, longHaulThisWeek: Math.max(0, num(data.flights, 0)) / 52 },
    diet: dietKey,
    shopping: { level: "medium" },
    home: { kwhThisWeek: num(data.electricity, 0) / 52 },
  };
}

function weeklyCommuteKg(commute) {
  if (!commute || typeof commute !== "object") return 0;
  const mode = String(commute.mode || "car").toLowerCase();
  const km = Math.max(0, num(commute.commuteKmThisWeek, 0));
  const kgPerKm = factors.commuteKgPerKm[mode];
  if (kgPerKm === undefined) return 0;
  return km * kgPerKm;
}

function weeklyFlightsKg(flights) {
  if (!flights || typeof flights !== "object") return 0;
  const s = Math.max(0, num(flights.shortHaulThisWeek, 0));
  const l = Math.max(0, num(flights.longHaulThisWeek, 0));
  return s * factors.flightKgPerTrip.shortHaul + l * factors.flightKgPerTrip.longHaul;
}

function weeklyDietKg(diet) {
  const key = String(diet || "average").toLowerCase();
  const annual = factors.dietAnnualKg[key] ?? factors.dietAnnualKg.average;
  return annual / 52;
}

function weeklyShoppingKg(shopping) {
  if (!shopping || typeof shopping !== "object") {
    return factors.shoppingAnnualKg.medium / 52;
  }
  const level = String(shopping.level || "medium").toLowerCase();
  const annual = factors.shoppingAnnualKg[level] ?? factors.shoppingAnnualKg.medium;
  return annual / 52;
}

function weeklyHomeElectricityKg(home) {
  if (!home || typeof home !== "object") return 0;
  const kwh = num(home.kwhThisWeek, 0);
  if (kwh <= 0) return 0;
  return kwh * factors.electricityKgPerKwh;
}

function sustainabilityScore(weeklyKg, globalWeeklyAvg) {
  const ratio = globalWeeklyAvg > 0 ? weeklyKg / globalWeeklyAvg : 1;
  return Math.round(Math.max(0, Math.min(100, 100 - ratio * 35)));
}

function gradeFromWeekly(weeklyKg, weeklyTarget) {
  if (weeklyKg <= weeklyTarget) return "A";
  if (weeklyKg <= weeklyTarget * 1.5) return "B";
  if (weeklyKg <= weeklyTarget * 2.5) return "C";
  if (weeklyKg <= weeklyTarget * 4) return "D";
  return "F";
}

/**
 * @param {object} raw — weekly habits or legacy annual-style (normalized internally)
 * @param {object} [opts]
 * @param {object} [opts.changeFromLastWeek] — merged into result if provided
 */
function calculateWeeklyFootprint(raw, opts = {}) {
  const data = legacyToWeeklyHabits(raw) || {};
  const commuteKg = weeklyCommuteKg(data.commute);
  const flightsKg = weeklyFlightsKg(data.flights);
  const dietKg = weeklyDietKg(data.diet);
  const shoppingKg = weeklyShoppingKg(data.shopping);
  const homeKg = weeklyHomeElectricityKg(data.home);

  const weeklyKgCO2e = commuteKg + flightsKg + dietKg + shoppingKg + homeKg;
  const projectedAnnualKg = weeklyKgCO2e * 52;

  const globalAvg = factors.benchmarks.globalAverageAnnualKg;
  const usAvg = factors.benchmarks.usAverageAnnualKg ?? globalAvg * 1.125;
  const targetAnnual = factors.benchmarks.parisAlignedPersonalAnnualKg;

  const globalWeekly = globalAvg / 52;
  const usWeekly = usAvg / 52;
  const targetWeekly = targetAnnual / 52;

  const score = sustainabilityScore(weeklyKgCO2e, globalWeekly);
  const grade = gradeFromWeekly(weeklyKgCO2e, targetWeekly);
  const overBudget = Math.max(0, weeklyKgCO2e - targetWeekly);
  const budgetStatus =
    weeklyKgCO2e <= targetWeekly
      ? "within"
      : weeklyKgCO2e <= targetWeekly * 1.5
        ? "over"
        : "far_over";

  const usRatio = usWeekly > 0 ? weeklyKgCO2e / usWeekly : 1;
  let relativeToUs = "average";
  if (usRatio < 0.85) relativeToUs = "below_average";
  else if (usRatio > 1.15) relativeToUs = "above_average";

  const { weekStart, weekEnd, weekKey } = getWeekRange();

  const breakdownWeeklyKg = {
    commute: Math.round(commuteKg),
    flights: Math.round(flightsKg),
    diet: Math.round(dietKg),
    shopping: Math.round(shoppingKg),
    home: Math.round(homeKg),
  };

  const projectedBreakdownKg = {
    commute: Math.round(commuteKg * 52),
    flights: Math.round(flightsKg * 52),
    diet: Math.round(dietKg * 52),
    shopping: Math.round(shoppingKg * 52),
    home: Math.round(homeKg * 52),
  };

  const footprint = {
    period: "week",
    weekStart,
    weekEnd,
    weekKey,
    weeklyKgCO2e: Math.round(weeklyKgCO2e),
    projectedAnnualKgCO2e: Math.round(projectedAnnualKg),
    /** Backward compatibility: same as projected annual from weekly × 52 */
    annualKgCO2e: Math.round(projectedAnnualKg),
    annualTonnesCO2e: Math.round((projectedAnnualKg / 1000) * 1000) / 1000,
    footprintScore: score,
    weeklyFootprintScore: score,
    grade,
    breakdownKg: breakdownWeeklyKg,
    breakdownWeeklyKg,
    projectedBreakdownKg,
    comparison: {
      globalAverageAnnualKg: globalAvg,
      usAverageAnnualKg: usAvg,
      globalAverageWeeklyKg: Math.round(globalWeekly * 100) / 100,
      usAverageWeeklyKg: Math.round(usWeekly * 100) / 100,
      yourPercentOfGlobalAverage:
        globalAvg > 0 ? Math.round((projectedAnnualKg / globalAvg) * 1000) / 10 : null,
      yourPercentOfUsAverage: usAvg > 0 ? Math.round((projectedAnnualKg / usAvg) * 1000) / 10 : null,
      relativeToUs,
    },
    carbonBudget: {
      targetAnnualKg: targetAnnual,
      targetWeeklyKg: Math.round(targetWeekly * 100) / 100,
      remainingKg: Math.round(Math.max(0, targetWeekly - weeklyKgCO2e)),
      overBudgetKg: Math.round(overBudget),
      status: budgetStatus,
      monthlyBudgetKg: Math.round(targetAnnual / 12),
      yourMonthlyAvgKg: Math.round(projectedAnnualKg / 12),
    },
    changeFromLastWeek: opts.changeFromLastWeek ?? null,
  };

  return footprint;
}

module.exports = {
  calculateWeeklyFootprint,
  legacyToWeeklyHabits,
  getWeekRange,
};
