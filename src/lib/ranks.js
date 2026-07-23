/**
 * Rank definitions for client-side use.
 * Matches the server-side implementation.
 */

export const RANK_THRESHOLDS = [
  { name: 'Unranked', minCoins: 0, color: '#5c6370', label: 'Unranked' },
  { name: 'Analyst', minCoins: 2500, color: '#22c55e', label: 'Analyst' },
  { name: 'Strategist', minCoins: 5000, color: '#3b82f6', label: 'Strategist' },
  { name: 'Forecaster', minCoins: 10000, color: '#a855f7', label: 'Forecaster' },
  { name: 'Visionary', minCoins: 25000, color: '#f59e0b', label: 'Visionary' },
  { name: 'Prophet', minCoins: 75000, color: '#ef4444', label: 'Prophet' },
  { name: 'Omniscient', minCoins: 250000, color: 'linear-gradient(135deg, #f59e0b, #ef4444, #a855f7, #3b82f6)', label: 'Omniscient' },
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
 * @param {number} coins
 * @returns {string}
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
 * Get CSS color for a rank.
 * @param {string} rank
 * @returns {string}
 */
export function getRankColor(rank) {
  const threshold = RANK_THRESHOLDS.find(t => t.name === rank);
  return threshold?.color || '#5c6370';
}

/**
 * Get display label for a rank.
 * @param {string} rank
 * @returns {string}
 */
export function getRankLabel(rank) {
  const threshold = RANK_THRESHOLDS.find(t => t.name === rank);
  return threshold?.label || 'Unranked';
}

/**
 * Get rank info object with all properties.
 * @param {number} coins
 * @returns {{ name: string, color: string, label: string, minCoins: number }}
 */
export function getRankInfo(coins) {
  const rank = getRank(coins);
  const threshold = RANK_THRESHOLDS.find(t => t.name === rank);
  return {
    name: rank,
    color: threshold?.color || '#5c6370',
    label: threshold?.label || 'Unranked',
    minCoins: threshold?.minCoins || 0,
  };
}
