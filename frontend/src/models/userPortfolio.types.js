/**
 * @file Database-oriented shapes for the User Portfolio. Mirrors `userPortfolio.schema.sql`.
 * Use these JSDoc typedefs when wiring API responses (no TS in this Vite project).
 */

/**
 * @typedef {Object} PortfolioUser
 * @property {string} id
 * @property {string} name
 * @property {string} [avatarUrl]
 * @property {string} initials
 * @property {number} totalXp
 * @property {number} level
 * @property {string} levelTitle
 * @property {number} streakDays
 * @property {number} maxStreakDays
 * @property {number} [annualKgCO2e]
 * @property {Record<string, number>} achievementStars
 */

/**
 * @typedef {Object} AchievementDefModel
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {string} icon
 * @property {string[]} starCriteria
 * @property {number[]} starXp
 * @property {string} [linkedBadgeId]
 */

/**
 * @typedef {Object} UserAchievementProgressRow
 * @property {string} userId
 * @property {string} achievementId
 * @property {0|1|2|3} starsUnlocked
 * @property {string} updatedAt ISO
 */

/**
 * @typedef {Object} WeeklyChallengeRow
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} estimatedCo2Label
 * @property {number} baseXp
 * @property {number} xpReward
 * @property {boolean} completed
 * @property {string} weekIdentifier
 */

/**
 * @typedef {Object} BadgeDisplay
 * @property {string} id
 * @property {string} title
 * @property {string} icon
 * @property {string} description
 * @property {string} badgeType
 * @property {string} earnedAt
 * @property {string} relatedSource
 */

/**
 * @typedef {Object} LeaderboardEntryModel
 * @property {string} id
 * @property {string} name
 * @property {number} annualKg
 * @property {number} totalXp
 * @property {string} [avatar]
 * @property {boolean} [isYou]
 */

export const PortfolioTypes = {
  /** Marker so the module is tree-shake friendly when imported for side effects. */
  version: 1,
};
