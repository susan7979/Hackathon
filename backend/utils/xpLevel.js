/** Mirrors frontend `xpLevel.js` thresholds for leaderboard / stored level. */
const LEVEL_START_XP = [0];

function buildLevelStarts() {
  LEVEL_START_XP.length = 0;
  LEVEL_START_XP.push(0);
  LEVEL_START_XP[1] = 0;
  LEVEL_START_XP[2] = 100;
  LEVEL_START_XP[3] = 250;
  LEVEL_START_XP[4] = 450;
  LEVEL_START_XP[5] = 700;
  let x = 700;
  for (let L = 6; L <= 99; L++) {
    const step = 250 + (L - 5) * 50;
    x += Math.min(step, 2500);
    LEVEL_START_XP[L] = x;
  }
}

buildLevelStarts();

function levelFromTotalXp(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let level = 1;
  for (let L = 99; L >= 1; L--) {
    if (xp >= LEVEL_START_XP[L]) {
      level = L;
      break;
    }
  }
  return Math.min(99, level);
}

module.exports = { levelFromTotalXp };
