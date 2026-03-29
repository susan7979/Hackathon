const userStore = require("../services/userStore");
const pledgeStore = require("../services/pledgeStore");
const { levelFromTotalXp } = require("../utils/xpLevel");

function enrichPledge(p) {
  const u = userStore.findById(p.userId);
  const liveTxp = u?.totalXp != null ? u.totalXp : 0;
  const hasSnapshot = p.xpAtPost != null && Number.isFinite(Number(p.xpAtPost));
  const txp = hasSnapshot
    ? Math.max(0, Math.min(99999999, Math.round(Number(p.xpAtPost))))
    : liveTxp;
  const level = hasSnapshot
    ? p.levelAtPost != null && Number.isFinite(Number(p.levelAtPost))
      ? Math.min(99, Math.max(1, Math.round(Number(p.levelAtPost))))
      : levelFromTotalXp(txp)
    : u?.level != null
      ? u.level
      : levelFromTotalXp(liveTxp);
  return {
    id: p.id,
    text: p.text,
    createdAt: p.createdAt,
    author: {
      id: p.userId,
      displayName: u?.displayName?.trim() || "Member",
      totalXp: txp,
      level,
    },
  };
}

/** GET /api/pledges — public list (newest first); ?limit=&offset= for paging */
exports.list = (req, res) => {
  const limit = Math.min(100, Math.max(1, Math.round(Number(req.query.limit)) || 50));
  const offset = Math.max(0, Math.round(Number(req.query.offset)) || 0);
  const raw = pledgeStore.listRecent(limit, offset);
  const pledges = raw.map(enrichPledge);
  res.json({
    pledges,
    total: pledgeStore.totalCount(),
  });
};

/** POST /api/pledges — auth required */
exports.create = (req, res) => {
  const text = req.body?.text;
  if (text == null || String(text).trim() === "") {
    return res.status(400).json({ error: "Pledge text is required." });
  }
  try {
    const xpAtPost = req.body?.xpAtPost;
    const levelAtPost = req.body?.levelAtPost;
    const snapshot = {};
    if (xpAtPost != null && Number.isFinite(Number(xpAtPost))) snapshot.xpAtPost = xpAtPost;
    if (levelAtPost != null && Number.isFinite(Number(levelAtPost))) snapshot.levelAtPost = levelAtPost;
    const row = pledgeStore.addPledge(req.user.sub, text, snapshot);
    res.status(201).json({ pledge: enrichPledge(row) });
  } catch (e) {
    if (e.code === "EMPTY") {
      return res.status(400).json({ error: "Pledge text cannot be empty." });
    }
    res.status(500).json({ error: "Could not save pledge", detail: e.message });
  }
};
