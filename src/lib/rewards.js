/**
 * Client-side reward utilities matching the server-side _shared/rewards.js.
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

export const COMMUNITY_REWARDS_BY_RANK = {
  'Unranked': { proposalCost: 50, approvalReward: 75, approvalXp: 100 },
  'Analyst': { proposalCost: 100, approvalReward: 150, approvalXp: 100 },
  'Strategist': { proposalCost: 200, approvalReward: 300, approvalXp: 100 },
  'Forecaster': { proposalCost: 500, approvalReward: 750, approvalXp: 100 },
  'Visionary': { proposalCost: 1000, approvalReward: 1500, approvalXp: 100 },
  'Prophet': { proposalCost: 2500, approvalReward: 3750, approvalXp: 100 },
  'Omniscient': { proposalCost: 5000, approvalReward: 7500, approvalXp: 100 },
};

export function getProposalCost(rank) {
  return COMMUNITY_REWARDS_BY_RANK[rank]?.proposalCost || 50;
}

export function getDailyReward(rank, isSunday = false) {
  const base = DAILY_REWARDS_BY_RANK[rank] || DAILY_REWARDS_BY_RANK['Unranked'];
  if (isSunday) {
    return { coins: base.coins * 3, xp: base.xp * 3 };
  }
  return { ...base };
}
