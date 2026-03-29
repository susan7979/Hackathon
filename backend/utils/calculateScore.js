const factors = require("../data/emissionFactors.json");

const WEEKS_PER_YEAR = 52;

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function annualCommuteKg(commute) {
  if (!commute || typeof commute !== "object") return 0;
  const mode = String(commute.mode || "car").toLowerCase();
  const kmPerDay = num(commute.kmPerDay, 0);
  const daysPerWeek = Math.min(7, Math.max(0, num(commute.daysPerWeek, 5)));
  const kgPerKm = factors.commuteKgPerKm[mode];
  if (kgPerKm === undefined) return 0;
  const annualKm = kmPerDay * daysPerWeek * WEEKS_PER_YEAR;
  return annualKm * kgPerKm;
}

function annualFlightsKg(flights) {
  if (!flights || typeof flights !== "object") return 0;
  const shortN = Math.max(0, num(flights.shortHaulPerYear, 0));
  const longN = Math.max(0, num(flights.longHaulPerYear, 0));
  return (
    shortN * factors.flightKgPerTrip.shortHaul +
    longN * factors.flightKgPerTrip.longHaul
  );
}

function annualDietKg(diet) {
  const key = String(diet || "average").toLowerCase();
  return factors.dietAnnualKg[key] ?? factors.dietAnnualKg.average;
}

function annualShoppingKg(shopping) {
  if (!shopping || typeof shopping !== "object") {
    return factors.shoppingAnnualKg.medium;
  }
  const level = String(shopping.level || "medium").toLowerCase();
  return factors.shoppingAnnualKg[level] ?? factors.shoppingAnnualKg.medium;
}

function annualHomeElectricityKg(home) {
  if (!home || typeof home !== "object") return 0;
  const kwhPerMonth = num(home.kwhPerMonth, 0);
  if (kwhPerMonth <= 0) return 0;
  return kwhPerMonth * 12 * factors.electricityKgPerKwh;
}

/** Legacy shape: { milesDriven, electricity, flights, diet } — best-effort mapping */
function legacyToHabits(data) {
  if (!data || typeof data !== "object") return null;
  if (data.commute || data.flights !== undefined || data.shopping || data.home) {
    return data;
  }
  const miles = num(data.milesDriven, 0);
  const milesPerWeek = miles / 52;
  const dietMap = { meat: "meat_heavy", vegetarian: "vegetarian", vegan: "vegan" };
  const dietKey = dietMap[String(data.diet || "").toLowerCase()] || "average";
  return {
    commute: { mode: "car", kmPerDay: milesPerWeek * 1.60934 / 5, daysPerWeek: 5 },
    flights: {
      shortHaulPerYear: 0,
      longHaulPerYear: Math.max(0, num(data.flights, 0)),
    },
    diet: dietKey,
    shopping: { level: "medium" },
    home: { kwhPerMonth: num(data.electricity, 0) },
  };
}

function sustainabilityScore(annualKg, globalAvg) {
  const ratio = globalAvg > 0 ? annualKg / globalAvg : 1;
  const score = Math.round(Math.max(0, Math.min(100, 100 - ratio * 35)));
  return score;
}

function gradeFromAnnual(annualKg, targetKg) {
  if (annualKg <= targetKg) return "A";
  if (annualKg <= targetKg * 1.5) return "B";
  if (annualKg <= targetKg * 2.5) return "C";
  if (annualKg <= targetKg * 4) return "D";
  return "F";
}

/**
 * @param {object} raw — habits or legacy body
 */
function calculateScore(raw) {
  const data = legacyToHabits(raw) || {};
  const commuteKg = annualCommuteKg(data.commute);
  const flightsKg = annualFlightsKg(data.flights);
  const dietKg = annualDietKg(data.diet);
  const shoppingKg = annualShoppingKg(data.shopping);
  const homeKg = annualHomeElectricityKg(data.home);

  const annualKgCO2e = commuteKg + flightsKg + dietKg + shoppingKg + homeKg;
  const globalAvg = factors.benchmarks.globalAverageAnnualKg;
  const usAvg = factors.benchmarks.usAverageAnnualKg ?? globalAvg * 1.125;
  const target = factors.benchmarks.parisAlignedPersonalAnnualKg;

  const score = sustainabilityScore(annualKgCO2e, globalAvg);
  const grade = gradeFromAnnual(annualKgCO2e, target);
  const overBudget = Math.max(0, annualKgCO2e - target);
  const budgetStatus =
    annualKgCO2e <= target
      ? "within"
      : annualKgCO2e <= target * 1.5
        ? "over"
        : "far_over";

  const usRatio = usAvg > 0 ? annualKgCO2e / usAvg : 1;
  let relativeToUs = "average";
  if (usRatio < 0.85) relativeToUs = "below_average";
  else if (usRatio > 1.15) relativeToUs = "above_average";

  return {
    annualKgCO2e: Math.round(annualKgCO2e),
    annualTonnesCO2e: Math.round((annualKgCO2e / 1000) * 1000) / 1000,
    footprintScore: score,
    grade,
    breakdownKg: {
      commute: Math.round(commuteKg),
      flights: Math.round(flightsKg),
      diet: Math.round(dietKg),
      shopping: Math.round(shoppingKg),
      home: Math.round(homeKg),
    },
    comparison: {
      globalAverageAnnualKg: globalAvg,
      usAverageAnnualKg: usAvg,
      yourPercentOfGlobalAverage:
        globalAvg > 0
          ? Math.round((annualKgCO2e / globalAvg) * 1000) / 10
          : null,
      yourPercentOfUsAverage:
        usAvg > 0 ? Math.round((annualKgCO2e / usAvg) * 1000) / 10 : null,
      relativeToUs,
    },
    carbonBudget: {
      targetAnnualKg: target,
      remainingKg: Math.round(Math.max(0, target - annualKgCO2e)),
      overBudgetKg: Math.round(overBudget),
      status: budgetStatus,
      monthlyBudgetKg: Math.round(target / 12),
      yourMonthlyAvgKg: Math.round(annualKgCO2e / 12),
    },
  };
}

module.exports = calculateScore;
