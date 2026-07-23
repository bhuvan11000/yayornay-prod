/**
 * Level and XP calculation utilities — Client-side version.
 * Matches the server-side implementation.
 */

/**
 * Calculate XP required to reach a given level.
 * Formula: floor(100 * 1.5^(level-1))
 * @param {number} level - Target level (1-based)
 * @returns {number}
 */
export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate the current level from total XP.
 * @param {number} totalXP
 * @returns {number}
 */
export function calculateLevel(totalXP) {
  let level = 1;
  let cumulative = 0;

  while (true) {
    const needed = xpForLevel(level);
    if (cumulative + needed > totalXP) break;
    cumulative += needed;
    level++;
  }

  return level;
}

/**
 * Get XP progress details for display.
 * @param {number} totalXP
 * @returns {{ currentLevel: number, xpInLevel: number, xpRequiredForNext: number, progress: number }}
 */
export function xpProgress(totalXP) {
  let level = 1;
  let cumulative = 0;

  while (true) {
    const needed = xpForLevel(level);
    if (cumulative + needed > totalXP) break;
    cumulative += needed;
    level++;
  }

  const xpInLevel = totalXP - cumulative;
  const xpRequiredForNext = xpForLevel(level);
  const progress = xpRequiredForNext > 0 ? xpInLevel / xpRequiredForNext : 1;

  return {
    currentLevel: level,
    xpInLevel,
    xpRequiredForNext,
    progress: Math.min(progress, 1),
  };
}

/**
 * Level unlock descriptions.
 */
export const LEVEL_UNLOCKS = {
  1: 'Predict on AI markets, view leaderboard',
  3: 'Vote on community proposals',
  5: 'Submit community market proposals',
  8: 'Daily quest slots: 3 → 4',
  10: 'Weekly quest slots: 2 → 3',
};
