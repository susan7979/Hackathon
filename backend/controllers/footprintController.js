const path = require("path");
const fs = require("fs");
const { calculateWeeklyFootprint } = require("../utils/calculateWeeklyFootprint");
const userStore = require("../services/userStore");
const weeklyRecordStore = require("../services/weeklyRecordStore");
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

function buildChangeFromLastWeek(prevRecord, currentWeeklyKg) {
  if (!prevRecord) return null;
  const prevKg = prevRecord.weeklyCarbonFootprint;
  const delta = currentWeeklyKg - prevKg;
  const pct = prevKg > 0 ? (delta / prevKg) * 100 : null;
  return {
    previousWeeklyKgCO2e: prevKg,
    weeklyKgDelta: Math.round(delta),
    percentChange: pct != null ? Math.round(pct * 10) / 10 : null,
    improved: delta < 0,
  };
}

exports.postCalculate = (req, res) => {
  const err = validateHabits(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const footprint = calculateWeeklyFootprint(req.body);
    res.json(footprint);
  } catch (e) {
    res.status(500).json({ error: "Calculation failed", detail: e.message });
  }
};

exports.getOffsetsCatalog = (req, res) => {
  res.json({ offsets: getCatalog() });
};

exports.getFactors = (_req, res) => {
  try {
    const raw = fs.readFileSync(factorsPath, "utf8");
    const factors = JSON.parse(raw);
    res.json({
      factors,
      methodology: {
        commute: "Weekly km × mode kg CO₂e per km (commute activity this week).",
        flights: "Short- and long-haul trips taken this week × kg per trip.",
        diet: "Annual diet band ÷ 52 → weekly food-system footprint (steady pattern).",
        shopping: "Consumption band ÷ 52 → weekly goods & services proxy.",
        home: "kWh this week × grid kg CO₂e per kWh.",
        projection: "Annual projection = weekly total × 52 (steady-state extrapolation).",
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Could not load factors", detail: e.message });
  }
};

exports.postCoach = async (req, res) => {
  const err = validateHabits(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const footprint = calculateWeeklyFootprint(req.body);
    const { plan, usedOpenAI } = await getCoachPlan(req.body, footprint);
    res.json({
      plan,
      usedOpenAI,
      aiEnabled: Boolean(
        typeof process.env.OPENAI_API_KEY === "string" && process.env.OPENAI_API_KEY.trim()
      ),
      footprintSummary: {
        weeklyKgCO2e: footprint.weeklyKgCO2e,
        projectedAnnualKgCO2e: footprint.projectedAnnualKgCO2e,
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
    const footprint = calculateWeeklyFootprint(req.body);
    const tonnes = footprint.annualTonnesCO2e;
    const ranked = rankOffsets(tonnes, 5);

    const ai = await enrichRecommendations(
      {
        annualKgCO2e: footprint.projectedAnnualKgCO2e,
        annualTonnesCO2e: footprint.annualTonnesCO2e,
        grade: footprint.grade,
        carbonBudget: footprint.carbonBudget,
        breakdownKg: footprint.projectedBreakdownKg || footprint.breakdownKg,
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

exports.postDashboard = async (req, res) => {
  const err = validateHabits(req.body);
  if (err) return res.status(400).json({ error: err });

  try {
    let changeFromLastWeek = null;
    let streakMeta = null;

    if (req.user) {
      const user = userStore.findById(req.user.sub);
      const tmp = calculateWeeklyFootprint(req.body);
      const prev = weeklyRecordStore.getPreviousRecord(req.user.sub, tmp.weekStart);
      changeFromLastWeek = buildChangeFromLastWeek(prev, tmp.weeklyKgCO2e);

      const sameWeek = weeklyRecordStore
        .listByUser(req.user.sub)
        .find((r) => r.weekStartDate === tmp.weekStart);
      const isSameWeekResubmit = Boolean(sameWeek);

      streakMeta = weeklyRecordStore.updateStreakForSubmit(user || {}, tmp.weekStart, isSameWeekResubmit);

      weeklyRecordStore.upsertRecord({
        userId: req.user.sub,
        weekStartDate: tmp.weekStart,
        weekEndDate: tmp.weekEnd,
        weekKey: tmp.weekKey,
        transportInput: req.body.commute || {},
        energyInput: req.body.home || {},
        foodInput: req.body.diet,
        shoppingInput: req.body.shopping || {},
        flightsInput: req.body.flights || {},
        weeklyCarbonFootprint: tmp.weeklyKgCO2e,
        weeklySustainabilityScore: tmp.footprintScore,
        projectedYearlyFootprint: tmp.projectedAnnualKgCO2e,
        benchmarkComparison: tmp.comparison,
        changeFromLastWeek,
      });

      userStore.updateWeeklyFootprintStats(req.user.sub, {
        projectedAnnualKgCO2e: tmp.projectedAnnualKgCO2e,
        weeklyKgCO2e: tmp.weeklyKgCO2e,
        weekVsPriorPercent: changeFromLastWeek?.percentChange ?? null,
        currentWeeklyStreak: streakMeta.currentWeeklyStreak,
        longestWeeklyStreak: streakMeta.longestWeeklyStreak,
        lastWeeklyWeekStart: tmp.weekStart,
      });
    }

    const footprint = calculateWeeklyFootprint(req.body, {
      changeFromLastWeek: changeFromLastWeek || undefined,
    });

    if (changeFromLastWeek) footprint.changeFromLastWeek = changeFromLastWeek;
    if (streakMeta) {
      footprint.streak = {
        currentWeeklyStreak: streakMeta.currentWeeklyStreak,
        longestWeeklyStreak: streakMeta.longestWeeklyStreak,
        streakBroken: streakMeta.streakBroken,
      };
    }

    const ranked = rankOffsets(footprint.annualTonnesCO2e, 5);
    const ai = await enrichRecommendations(
      {
        annualKgCO2e: footprint.projectedAnnualKgCO2e,
        annualTonnesCO2e: footprint.annualTonnesCO2e,
        grade: footprint.grade,
        carbonBudget: footprint.carbonBudget,
        breakdownKg: footprint.projectedBreakdownKg || footprint.breakdownKg,
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

/** GET /weekly/history — last N weekly records for charts */
exports.getWeeklyHistory = (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  const limit = Math.min(52, Math.max(1, parseInt(req.query.limit, 10) || 24));
  const rows = weeklyRecordStore.listByUser(req.user.sub).slice(0, limit);
  res.json({ weeks: rows });
};
