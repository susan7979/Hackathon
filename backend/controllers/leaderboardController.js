const path = require("path");
const fs = require("fs");
const userStore = require("../services/userStore");
const { levelFromTotalXp } = require("../utils/xpLevel");

const SEED_PATH = path.join(__dirname, "..", "data", "leaderboardSeed.json");

function loadSeeds() {
  try {
    const raw = fs.readFileSync(SEED_PATH, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** GET — optional JWT; ?mode=weekly|projected|xp|improved */
exports.getLeaderboard = (req, res) => {
  const mode = String(req.query.mode || "weekly").toLowerCase();

  const seeds = loadSeeds().map((s) => ({
    id: s.id,
    name: s.name,
    annualKg: s.annualKg,
    weeklyKg: s.annualKg != null ? Math.round(s.annualKg / 52) : null,
    weekVsPriorPercent: null,
    totalXp: s.totalXp != null ? s.totalXp : 0,
    avatar: s.avatar,
    isYou: false,
  }));

  const users = userStore.getPublicUsers().map((u) => ({
    id: u.id,
    name: u.displayName,
    annualKg: u.annualKgCO2e,
    weeklyKg: u.weeklyKgCO2e != null ? u.weeklyKgCO2e : u.annualKgCO2e != null ? Math.round(u.annualKgCO2e / 52) : null,
    weekVsPriorPercent: u.weekVsPriorPercent,
    totalXp: u.totalXp != null ? u.totalXp : 0,
    level: u.level != null ? u.level : levelFromTotalXp(u.totalXp || 0),
    avatar: "⭐",
    isYou: Boolean(req.user && req.user.sub === u.id),
  }));

  const withFootprint = users.filter((u) => u.weeklyKg != null && !Number.isNaN(u.weeklyKg));
  const withProjected = users.filter((u) => u.annualKg != null && !Number.isNaN(u.annualKg));

  let entries = [...seeds, ...users];
  if (mode === "weekly") {
    entries = [...seeds.filter((s) => s.weeklyKg != null), ...withFootprint].sort(
      (a, b) => (a.weeklyKg || 999999) - (b.weeklyKg || 999999)
    );
  } else if (mode === "projected") {
    entries = [...seeds, ...withProjected].sort((a, b) => (a.annualKg || 999999) - (b.annualKg || 999999));
  } else if (mode === "improved") {
    const imp = [...seeds, ...users].filter((e) => e.weekVsPriorPercent != null && e.weekVsPriorPercent < 0);
    entries = imp.sort((a, b) => (a.weekVsPriorPercent || 0) - (b.weekVsPriorPercent || 0));
  } else {
    entries = [...entries].sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
  }

  if (req.user) {
    entries.forEach((e) => {
      e.isYou = e.id === req.user.sub;
    });
  }

  function rankIn(list) {
    if (!req.user) return null;
    const ix = list.findIndex((e) => e.id === req.user.sub);
    return ix === -1 ? null : ix + 1;
  }

  const byXpSorted = [...users, ...seeds].sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
  const weeklySorted = [...seeds.filter((s) => s.weeklyKg != null), ...withFootprint].sort(
    (a, b) => (a.weeklyKg || 999999) - (b.weeklyKg || 999999)
  );
  const projectedSorted = [...seeds, ...withProjected].sort(
    (a, b) => (a.annualKg || 999999) - (b.annualKg || 999999)
  );
  const improvedSorted = [...seeds, ...users]
    .filter((e) => e.weekVsPriorPercent != null && e.weekVsPriorPercent < 0)
    .sort((a, b) => (a.weekVsPriorPercent || 0) - (b.weekVsPriorPercent || 0));

  const yourRankWeekly = rankIn(weeklySorted);
  const yourRankProjected = rankIn(projectedSorted);
  const yourRankImproved = rankIn(improvedSorted);
  const yourRankXp = rankIn(byXpSorted);

  res.json({
    mode,
    entries,
    yourRank:
      mode === "weekly"
        ? yourRankWeekly
        : mode === "projected"
          ? yourRankProjected
          : mode === "improved"
            ? yourRankImproved
            : yourRankXp,
    yourRankWeekly,
    yourRankProjected,
    yourRankImproved,
    yourRankXp,
    yourId: req.user ? req.user.sub : null,
    total: entries.length,
  });
};

exports.postSubmitXp = (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  const { totalXp, level, achievementStars, badgesEarned } = req.body || {};
  if (totalXp == null || Number.isNaN(Number(totalXp))) {
    return res.status(400).json({ error: "totalXp is required (number)" });
  }
  const updated = userStore.updateGamify(req.user.sub, {
    totalXp,
    level,
    achievementStars,
    badgesEarned,
  });
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json({
    ok: true,
    totalXp: updated.totalXp,
    level: updated.level,
    achievementStars: updated.achievementStars,
    badgesEarned: updated.badgesEarned,
    updatedAt: updated.gamifyUpdatedAt,
  });
};

exports.postSubmitFootprint = (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  const kg = req.body?.annualKgCO2e;
  if (kg == null || Number.isNaN(Number(kg))) {
    return res.status(400).json({ error: "annualKgCO2e is required (number)" });
  }
  const updated = userStore.updateFootprint(req.user.sub, kg);
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json({
    ok: true,
    annualKgCO2e: updated.annualKgCO2e,
    updatedAt: updated.updatedAt,
  });
};
