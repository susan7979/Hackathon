const offsets = require("../data/offsets.json");

/**
 * Value = credibility / $ per tonne (higher = more impact per dollar).
 * @param {number} tonnesToOffset — CO2e tonnes user wants to neutralize
 */
function rankOffsets(tonnesToOffset, limit = 5) {
  const t = Math.max(0.001, Number(tonnesToOffset) || 0.001);
  const ranked = offsets.map((o) => {
    const valueScore =
      o.costUsdPerTonne > 0 ? o.credibility / o.costUsdPerTonne : 0;
    const estCostUsd = Math.round(t * o.costUsdPerTonne * 100) / 100;
    return {
      ...o,
      valueScore: Math.round(valueScore * 10000) / 10000,
      estimatedCostUsd: estCostUsd,
      estimatedCostForYourFootprint: estCostUsd,
    };
  });
  ranked.sort((a, b) => b.valueScore - a.valueScore);
  return ranked.slice(0, limit);
}

function getCatalog() {
  return offsets;
}

module.exports = { rankOffsets, getCatalog };
