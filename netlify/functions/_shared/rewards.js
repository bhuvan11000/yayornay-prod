/**
 * Reward definitions and calculation utilities.
 * Used for daily login rewards and community creator rewards.
 */

/**
 * Daily login rewards scaled by rank.
 * { coins, xp } for Mon-Sat. Sunday applies 3x multiplier.
 */
export const DAILY_REWARDS_BY_RANK = {
  'Unranked': { coins: 50, xp: 5 },
  'Analyst': { coins: 75, xp: 8 },
  'Strategist': { coins: 100, xp: 10 },
  'Forecaster': { coins: 150, xp: 15 },
  'Visionary': { coins: 250, xp: 25 },
  'Prophet': { coins: 500, xp: 50 },
  'Omniscient': { coins: 1000, xp: 100 },
};

/**
 * Community market creator rewards scaled by rank.
 */
export const COMMUNITY_REWARDS_BY_RANK = {
  'Unranked': { proposalCost: 50, approvalReward: 75, approvalXp: 100, participation25: 100, participation50: 200, participation100: 500 },
  'Analyst': { proposalCost: 100, approvalReward: 150, approvalXp: 100, participation25: 200, participation50: 400, participation100: 1000 },
  'Strategist': { proposalCost: 200, approvalReward: 300, approvalXp: 100, participation25: 400, participation50: 800, participation100: 2000 },
  'Forecaster': { proposalCost: 500, approvalReward: 750, approvalXp: 100, participation25: 1000, participation50: 2000, participation100: 5000 },
  'Visionary': { proposalCost: 1000, approvalReward: 1500, approvalXp: 100, participation25: 2000, participation50: 4000, participation100: 10000 },
  'Prophet': { proposalCost: 2500, approvalReward: 3750, approvalXp: 100, participation25: 5000, participation50: 10000, participation100: 25000 },
  'Omniscient': { proposalCost: 5000, approvalReward: 7500, approvalXp: 100, participation25: 10000, participation50: 20000, participation100: 50000 },
};

/**
 * Get daily reward for a given rank.
 *
 * @param {string} rank - Current rank name
 * @param {boolean} isSunday - Whether today is Sunday (3x multiplier)
 * @returns {{ coins: number, xp: number }}
 */
export function getDailyReward(rank, isSunday = false) {
  const base = DAILY_REWARDS_BY_RANK[rank] || DAILY_REWARDS_BY_RANK['Unranked'];

  if (isSunday) {
    return {
      coins: base.coins * 3,
      xp: base.xp * 3,
    };
  }

  return { ...base };
}

/**
 * Get community proposal cost for a given rank.
 *
 * @param {string} rank - Current rank name
 * @returns {number} Cost in coins
 */
export function getProposalCost(rank) {
  return COMMUNITY_REWARDS_BY_RANK[rank]?.proposalCost || 50;
}

/**
 * Get community approval reward for a given rank.
 *
 * @param {string} rank - Current rank name
 * @returns {{ coins: number, xp: number }}
 */
export function getApprovalReward(rank) {
  const r = COMMUNITY_REWARDS_BY_RANK[rank] || COMMUNITY_REWARDS_BY_RANK['Unranked'];
  return { coins: r.approvalReward, xp: r.approvalXp };
}
