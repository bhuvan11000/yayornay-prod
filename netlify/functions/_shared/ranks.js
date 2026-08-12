import { supabaseAdmin } from './supabase.js';

/**
 * Rank thresholds, colors, and calculation utilities.
 * Ranks are purely coin-balance based and can go up or down.
 */

export const RANK_THRESHOLDS = [
  { name: 'Unranked', minCoins: 0, color: '#5c6370' },
  { name: 'Analyst', minCoins: 2500, color: '#22c55e' },
  { name: 'Strategist', minCoins: 5000, color: '#3b82f6' },
  { name: 'Forecaster', minCoins: 10000, color: '#a855f7' },
  { name: 'Visionary', minCoins: 25000, color: '#f59e0b' },
  { name: 'Prophet', minCoins: 75000, color: '#ef4444' },
  { name: 'Omniscient', minCoins: 250000, color: 'linear-gradient(135deg, #f59e0b, #ef4444, #a855f7, #3b82f6)' },
];

export const RANK_ORDER = {
  'Unranked': 0,
  'Analyst': 1,
  'Strategist': 2,
  'Forecaster': 3,
  'Visionary': 4,
  'Prophet': 5,
  'Omniscient': 6,
};

/**
 * Get rank name from coin balance.
 *
 * @param {number} coins - Current coin balance
 * @returns {string} Rank name
 */
export function getRank(coins) {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (coins >= RANK_THRESHOLDS[i].minCoins) {
      return RANK_THRESHOLDS[i].name;
    }
  }
  return 'Unranked';
}

/**
 * Get the CSS color for a rank.
 *
 * @param {string} rank - Rank name
 * @returns {string} CSS color value
 */
export function getRankColor(rank) {
  const threshold = RANK_THRESHOLDS.find(t => t.name === rank);
  return threshold?.color || '#5c6370';
}

/**
 * Check if user's rank changed and update DB if needed.
 *
 * @param {string} userId - User UUID
 * @param {number} newCoinBalance - Updated coin balance
 * @param {string} oldRank - Previous rank
 * @returns {Promise<object>} Rank change info
 */
export async function checkRankChange(userId, newCoinBalance, oldRank) {
  const newRank = getRank(newCoinBalance);

  if (newRank !== oldRank) {
    await supabaseAdmin
      .from('users')
      .update({ rank: newRank })
      .eq('id', userId);

    return {
      rankChanged: true,
      oldRank,
      newRank,
      promoted: RANK_ORDER[newRank] > RANK_ORDER[oldRank],
      demoted: RANK_ORDER[newRank] < RANK_ORDER[oldRank],
    };
  }

  return { rankChanged: false };
}

/**
 * Build rank-up info for a promotion. Pure helper (no DB writes).
 *
 * @param {string} oldRank - Rank before the change
 * @param {string} newRank - Rank after the change
 * @returns {object|null} Rank-up info, or null when not a promotion
 */
export function buildRankUp(oldRank, newRank) {
  if (!newRank || newRank === oldRank) return null;
  if (RANK_ORDER[newRank] > RANK_ORDER[oldRank]) {
    return { rankedUp: true, oldRank, newRank };
  }
  return null;
}
