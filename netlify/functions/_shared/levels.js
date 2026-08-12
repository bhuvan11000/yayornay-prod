import { supabaseAdmin } from './supabase.js';

/**
 * Level and XP calculation utilities.
 * XP only goes up. Levels unlock features.
 */

export const LEVEL_UNLOCKS = {
  1: 'Predict on AI markets, view leaderboard',
  3: 'Vote on community proposals, submit community market proposals',
  8: 'Daily quest slots: 3 → 4',
  10: 'Weekly quest slots: 2 → 3',
};

/**
 * Calculate XP required to reach a given level.
 * Formula: floor(100 * 1.5^(level-1))
 *
 * @param {number} level - Target level (1-based)
 * @returns {number} XP required for this level alone
 */
export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate the current level from total XP.
 *
 * @param {number} totalXP - Cumulative XP earned
 * @returns {number} Current level
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
 *
 * @param {number} totalXP - Cumulative XP earned
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
 * Check if user leveled up and update DB if needed.
 *
 * @param {string} userId - User UUID
 * @param {number} currentXP - Current total XP
 * @param {number} currentLevel - Current level
 * @returns {Promise<object>} Level up info
 */
export async function checkLevelUp(userId, currentXP, currentLevel) {
  const newLevel = calculateLevel(currentXP);

  if (newLevel > currentLevel) {
    await supabaseAdmin
      .from('users')
      .update({ level: newLevel })
      .eq('id', userId);

    // Calculate newly unlocked features
    const unlocks = Object.entries(LEVEL_UNLOCKS)
      .filter(([lvl]) => parseInt(lvl) > currentLevel && parseInt(lvl) <= newLevel)
      .map(([_, desc]) => desc);

    const xpToNext = xpForLevel(newLevel + 1) - (currentXP - cumulativeXP(newLevel));

    return {
      leveledUp: true,
      oldLevel: currentLevel,
      newLevel,
      xpToNext,
      unlocks,
    };
  }

  const xpToNext = xpForLevel(currentLevel + 1) - (currentXP - cumulativeXP(currentLevel));

  return { leveledUp: false, xpToNext };
}

function cumulativeXP(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}
