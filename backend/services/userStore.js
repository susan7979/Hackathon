const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const DATA = path.join(__dirname, "..", "data", "authUsers.json");

function readAll() {
  try {
    const raw = fs.readFileSync(DATA, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
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

function getPublicUsers() {
  return readAll().map((u) => ({
    id: u.id,
    displayName: u.displayName,
    annualKgCO2e: u.annualKgCO2e,
    updatedAt: u.updatedAt,
  }));
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  verifyLogin,
  updateFootprint,
  getPublicUsers,
};
