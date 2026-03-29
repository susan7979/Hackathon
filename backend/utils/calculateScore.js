/**
 * Back-compat name: returns footprint with weeklyKgCO2e as primary model;
 * annualKgCO2e = projected annual (weekly × 52).
 */
const { calculateWeeklyFootprint } = require("./calculateWeeklyFootprint");

function calculateScore(raw) {
  return calculateWeeklyFootprint(raw);
}

module.exports = calculateScore;
