const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA = path.join(__dirname, "..", "data", "pledges.json");
const MAX_STORED = 800;
const MAX_TEXT = 500;

function readAll() {
  try {
    const raw = fs.readFileSync(DATA, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(rows) {
  fs.mkdirSync(path.dirname(DATA), { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(rows, null, 2), "utf8");
}

function totalCount() {
  return readAll().length;
}

/** Newest first; optional offset for paging older pledges */
function listRecent(limit = 100, offset = 0) {
  const all = readAll();
  const sorted = [...all].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const o = Math.max(0, Math.floor(Number(offset)) || 0);
  const lim = Math.min(Math.max(1, Math.floor(Number(limit)) || 50), 200);
  return sorted.slice(o, o + lim);
}

function addPledge(userId, text, snapshot = {}) {
  const t = String(text || "").trim().slice(0, MAX_TEXT);
  if (!t) {
    const err = new Error("EMPTY");
    err.code = "EMPTY";
    throw err;
  }
  const rows = readAll();
  const row = {
    id: crypto.randomUUID(),
    userId: String(userId),
    text: t,
    createdAt: new Date().toISOString(),
  };
  if (snapshot.xpAtPost != null && Number.isFinite(Number(snapshot.xpAtPost))) {
    row.xpAtPost = Math.max(0, Math.min(99999999, Math.round(Number(snapshot.xpAtPost))));
  }
  if (snapshot.levelAtPost != null && Number.isFinite(Number(snapshot.levelAtPost))) {
    row.levelAtPost = Math.min(99, Math.max(1, Math.round(Number(snapshot.levelAtPost))));
  }
  rows.unshift(row);
  writeAll(rows.slice(0, MAX_STORED));
  return row;
}

module.exports = {
  listRecent,
  addPledge,
  totalCount,
};
