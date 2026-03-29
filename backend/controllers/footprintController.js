const path = require("path");
const fs = require("fs");
const calculateScore = require("../utils/calculateScore");
const { rankOffsets, getCatalog } = require("../utils/rankOffsets");
const { enrichRecommendations } = require("../services/aiOffsets");
const { getCoachPlan } = require("../services/aiCoach");

const factorsPath = path.join(__dirname, "..", "data", "emissionFactors.json");

function validateHabits(body) {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object.";
  }
  return null;
}

exports.postCalculate = (req, res) => {
  const err = validateHabits(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const result = calculateScore(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: "Calculation failed", detail: e.message });
  }
};

exports.getOffsetsCatalog = (req, res) => {
  res.json({ offsets: getCatalog() });
};

/** Transparency: raw emission factors + methodology notes */
exports.getFactors = (_req, res) => {
  try {
    const raw = fs.readFileSync(factorsPath, "utf8");
    const factors = JSON.parse(raw);
    res.json({
      factors,
      methodology: {
        commute:
          "Annual km = km/day × days/week × 52; multiply by mode kg CO₂e per km.",
        flights: "Trip counts × kg per short-haul vs long-haul leg (approximate).",
        diet: "Fixed annual kg CO₂e by diet band (food systems average, rounded).",
        shopping: "Low / medium / high consumption bands (goods & services proxy).",
        home: "Monthly kWh × 12 × grid kg CO₂e per kWh (default mix proxy).",
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Could not load factors", detail: e.message });
  }
};

/** AI personal coach plan — OpenAI when configured, else built-in rule-based plan */
exports.postCoach = async (req, res) => {
  const err = validateHabits(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const footprint = calculateScore(req.body);
    const { plan, usedOpenAI } = await getCoachPlan(req.body, footprint);
    res.json({
      plan,
      usedOpenAI,
      aiEnabled: Boolean(
        typeof process.env.OPENAI_API_KEY === "string" && process.env.OPENAI_API_KEY.trim()
      ),
      footprintSummary: {
        annualKgCO2e: footprint.annualKgCO2e,
        breakdownKg: footprint.breakdownKg,
        grade: footprint.grade,
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Coach failed", detail: e.message });
  }
};

exports.postRecommendations = async (req, res) => {
  const err = validateHabits(req.body);
  if (err) return res.status(400).json({ error: err });

  try {
    const footprint = calculateScore(req.body);
    const tonnes = footprint.annualTonnesCO2e;
    const ranked = rankOffsets(tonnes, 5);

    const ai = await enrichRecommendations(
      {
        annualKgCO2e: footprint.annualKgCO2e,
        annualTonnesCO2e: footprint.annualTonnesCO2e,
        grade: footprint.grade,
        carbonBudget: footprint.carbonBudget,
        breakdownKg: footprint.breakdownKg,
      },
      ranked
    );

    res.json({
      footprint,
      recommendations: ranked.map((o, i) => ({
        rank: i + 1,
        offsetId: o.id,
        name: o.name,
        type: o.type,
        costUsdPerTonne: o.costUsdPerTonne,
        credibility: o.credibility,
        valueScore: o.valueScore,
        description: o.description,
        estimatedCostUsd: o.estimatedCostUsd,
      })),
      ai: ai || undefined,
      aiEnabled: Boolean(process.env.OPENAI_API_KEY),
    });
  } catch (e) {
    res.status(500).json({ error: "Recommendations failed", detail: e.message });
  }
};

/** Single payload for dashboard: footprint + ranked offsets + optional AI */
exports.postDashboard = async (req, res) => {
  const err = validateHabits(req.body);
  if (err) return res.status(400).json({ error: err });

  try {
    const footprint = calculateScore(req.body);
    const ranked = rankOffsets(footprint.annualTonnesCO2e, 5);
    const ai = await enrichRecommendations(
      {
        annualKgCO2e: footprint.annualKgCO2e,
        annualTonnesCO2e: footprint.annualTonnesCO2e,
        grade: footprint.grade,
        carbonBudget: footprint.carbonBudget,
        breakdownKg: footprint.breakdownKg,
      },
      ranked
    );

    res.json({
      footprint,
      offsetsRanked: ranked,
      ai,
      aiEnabled: Boolean(process.env.OPENAI_API_KEY),
    });
  } catch (e) {
    res.status(500).json({ error: "Dashboard failed", detail: e.message });
  }
};
