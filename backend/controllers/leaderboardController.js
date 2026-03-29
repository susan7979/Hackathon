const path = require("path");
const fs = require("fs");
const userStore = require("../services/userStore");

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

/** GET — optional JWT to mark "you" and return yourRank */
exports.getLeaderboard = (req, res) => {
  const seeds = loadSeeds().map((s) => ({
    id: s.id,
    name: s.name,
    annualKg: s.annualKg,
    totalXp: s.totalXp != null ? s.totalXp : 0,
    avatar: s.avatar,
    isYou: false,
  }));

  const users = userStore
    .getPublicUsers()
    .filter((u) => u.annualKgCO2e != null && !Number.isNaN(u.annualKgCO2e))
    .map((u) => ({
      id: u.id,
      name: u.displayName,
      annualKg: u.annualKgCO2e,
      totalXp: u.totalXp != null ? u.totalXp : 0,
      avatar: "⭐",
      isYou: Boolean(req.user && req.user.sub === u.id),
    }));

  const entries = [...seeds, ...users].sort((a, b) => a.annualKg - b.annualKg);

  if (req.user) {
    entries.forEach((e) => {
      e.isYou = e.id === req.user.sub;
    });
  }

  let yourRank = null;
  if (req.user) {
    const idx = entries.findIndex((e) => e.id === req.user.sub);
    yourRank = idx === -1 ? null : idx + 1;
  }

  const byXp = [...entries].sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
  let yourRankXp = null;
  if (req.user) {
    const ix = byXp.findIndex((e) => e.id === req.user.sub);
    yourRankXp = ix === -1 ? null : ix + 1;
  }

  res.json({
    entries,
    yourRank,
    yourRankXp,
    yourId: req.user ? req.user.sub : null,
    total: entries.length,
  });
};

exports.postSubmitXp = (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  const xp = req.body?.totalXp;
  if (xp == null || Number.isNaN(Number(xp))) {
    return res.status(400).json({ error: "totalXp is required (number)" });
  }
  const updated = userStore.updateXp(req.user.sub, xp);
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json({
    ok: true,
    totalXp: updated.totalXp,
    updatedAt: updated.xpUpdatedAt,
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
