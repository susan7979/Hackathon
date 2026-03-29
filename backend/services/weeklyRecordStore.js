const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA = path.join(__dirname, "..", "data", "weeklyRecords.json");

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

function listByUser(userId) {
  return readAll()
    .filter((r) => r.userId === userId)
    .sort((a, b) => new Date(b.weekStartDate) - new Date(a.weekStartDate));
}

/** Most recent record strictly before this week (different weekStart). */
function getPreviousRecord(userId, weekStartDate) {
  const rows = listByUser(userId).filter((r) => r.weekStartDate < weekStartDate);
  return rows[0] || null;
}

function upsertRecord(payload) {
  const all = readAll();
  const idx = all.findIndex(
    (r) => r.userId === payload.userId && r.weekStartDate === payload.weekStartDate
  );
  const now = new Date().toISOString();
  if (idx === -1) {
    const row = {
      id: crypto.randomUUID(),
      ...payload,
      createdAt: now,
      updatedAt: now,
    };
    all.push(row);
    writeAll(all);
    return { row, replaced: false };
  }
  const merged = {
    ...all[idx],
    ...payload,
    id: all[idx].id,
    createdAt: all[idx].createdAt,
    updatedAt: now,
  };
  all[idx] = merged;
  writeAll(all);
  return { row: merged, replaced: true };
}

function daysBetweenWeekStarts(a, b) {
  const d = (new Date(b) - new Date(a)) / 86400000;
  return Math.round(d);
}

/**
 * @returns {{ currentWeeklyStreak: number, longestWeeklyStreak: number, streakBroken: boolean }}
 */
function updateStreakForSubmit(user, weekStartDate, isSameWeekResubmit) {
  const lastStart = user.lastWeeklyWeekStart;
  let current = user.currentWeeklyStreak || 0;
  let longest = user.longestWeeklyStreak || 0;

  if (isSameWeekResubmit) {
    return { currentWeeklyStreak: current, longestWeeklyStreak: longest, streakBroken: false };
  }

  let diff = null;
  if (!lastStart) {
    current = 1;
  } else {
    diff = daysBetweenWeekStarts(lastStart, weekStartDate);
    if (diff === 7) current += 1;
    else current = 1;
  }

  longest = Math.max(longest, current);
  const streakBroken = Boolean(lastStart && diff != null && diff > 7);
  return { currentWeeklyStreak: current, longestWeeklyStreak: longest, streakBroken };
}

module.exports = {
  listByUser,
  getPreviousRecord,
  upsertRecord,
  updateStreakForSubmit,
  readAll,
};
