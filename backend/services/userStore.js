const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { ACHIEVEMENT_IDS } = require("../data/achievementIds");
const { levelFromTotalXp } = require("../utils/xpLevel");

const DATA = path.join(__dirname, "..", "data", "authUsers.json");

function sanitizeAchievementStars(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!ACHIEVEMENT_IDS.has(k)) continue;
    const n = Math.min(3, Math.max(0, Math.round(Number(v)) || 0));
    if (n > 0) out[k] = n;
  }
  return out;
}

function sanitizeBadgesEarned(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x).slice(0, 64)).filter(Boolean).slice(0, 80);
}

function migrateUser(u) {
  if (!u) return u;
  if (u.totalXp == null || Number.isNaN(Number(u.totalXp))) u.totalXp = 0;
  if (!u.achievementStars || typeof u.achievementStars !== "object") u.achievementStars = {};
  if (!Array.isArray(u.badgesEarned)) u.badgesEarned = [];
  if (u.level == null || Number.isNaN(Number(u.level))) {
    u.level = levelFromTotalXp(u.totalXp || 0);
  }
  return u;
}

function readAll() {
  try {
    const raw = fs.readFileSync(DATA, "utf8");
    const arr = JSON.parse(raw);
    const list = Array.isArray(arr) ? arr : [];
    return list.map((u) => migrateUser({ ...u }));
  } catch {
    return [];
  }
}

function writeAll(users) {
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(users, null, 2), "utf8");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function findByEmail(email) {
  const e = normalizeEmail(email);
  return readAll().find((u) => u.email === e) || null;
}

function findById(id) {
  return readAll().find((u) => u.id === id) || null;
}

/** Safe gamification blob for API responses (no secrets). */
function getGamificationSnapshot(user) {
  if (!user) return null;
  const txp = user.totalXp != null ? user.totalXp : 0;
  return {
    totalXp: txp,
    level: user.level != null ? user.level : levelFromTotalXp(txp),
    achievementStars: { ...(user.achievementStars || {}) },
    badgesEarned: [...(user.badgesEarned || [])],
    updatedAt: user.gamifyUpdatedAt || user.xpUpdatedAt || null,
  };
}

async function createUser({ email, password, displayName }) {
  const users = readAll();
  const e = normalizeEmail(email);
  if (users.some((u) => u.email === e)) {
    const err = new Error("EMAIL_TAKEN");
    err.code = "EMAIL_TAKEN";
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    email: e,
    passwordHash,
    displayName: String(displayName || "").trim().slice(0, 80),
    annualKgCO2e: null,
    updatedAt: null,
    totalXp: 0,
    level: 1,
    achievementStars: {},
    badgesEarned: [],
    gamifyUpdatedAt: null,
    xpUpdatedAt: null,
  };
  users.push(user);
  writeAll(users);
  return { id: user.id, email: user.email, displayName: user.displayName };
}

async function verifyLogin(email, password) {
  const user = findByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, email: user.email, displayName: user.displayName };
}

function updateFootprint(userId, annualKgCO2e) {
  const users = readAll();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return null;
  users[i].annualKgCO2e = Math.round(Number(annualKgCO2e));
  users[i].updatedAt = new Date().toISOString();
  writeAll(users);
  return users[i];
}

/**
 * Persists XP, level, per-achievement star counts, and badge ids for leaderboards + cross-device sync.
 * Omitted fields keep previous values.
 */
function updateGamify(userId, body = {}) {
  const users = readAll();
  const i = users.findIndex((u) => u.id === userId);
  if (i === -1) return null;
  const u = users[i];

  if (body.totalXp != null) {
    const n = Math.max(0, Math.min(99999999, Math.round(Number(body.totalXp))));
    u.totalXp = Number.isFinite(n) ? n : u.totalXp ?? 0;
  }

  if (body.level != null) {
    const L = Math.round(Number(body.level));
    if (Number.isFinite(L)) u.level = Math.min(99, Math.max(1, L));
  } else if (body.totalXp != null) {
    u.level = levelFromTotalXp(u.totalXp);
  }

  if (body.achievementStars != null && typeof body.achievementStars === "object") {
    u.achievementStars = sanitizeAchievementStars(body.achievementStars);
  }

  if (body.badgesEarned != null) {
    u.badgesEarned = sanitizeBadgesEarned(body.badgesEarned);
  }

  const now = new Date().toISOString();
  u.gamifyUpdatedAt = now;
  u.xpUpdatedAt = now;

  writeAll(users);
  return users[i];
}

function updateXp(userId, totalXp) {
  return updateGamify(userId, { totalXp });
}

function getPublicUsers() {
  return readAll().map((u) => {
    const txp = u.totalXp != null ? u.totalXp : 0;
    return {
      id: u.id,
      displayName: u.displayName,
      annualKgCO2e: u.annualKgCO2e,
      updatedAt: u.updatedAt,
      totalXp: txp,
      level: u.level != null ? u.level : levelFromTotalXp(txp),
    };
  });
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  verifyLogin,
  updateFootprint,
  updateXp,
  updateGamify,
  getPublicUsers,
  getGamificationSnapshot,
};
