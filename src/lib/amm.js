/**
 * LMSR (Logarithmic Market Scoring Rule) AMM math — Client-side version.
 * Used for UI previews and calculations before sending to the server.
 *
 * Matches the server-side implementation in netlify/functions/_shared/amm.js
 */

/**
 * Cost function: C(q_yes, q_no) = b * ln(e^(q_yes/b) + e^(q_no/b))
 */
export function costFunction(qYes, qNo, b) {
  return b * Math.log(Math.exp(qYes / b) + Math.exp(qNo / b));
}

/**
 * Get current price for a given side.
 */
export function getPrice(qYes, qNo, b, side) {
  const expYes = Math.exp(qYes / b);
  const expNo = Math.exp(qNo / b);
  const total = expYes + expNo;

  if (total === 0) return 0.5;

  return side === 'yes' ? expYes / total : expNo / total;
}

/**
 * Calculate shares received for a given cost using binary search.
 */
export function calculateShares(qYes, qNo, b, position, coins) {
  const currentQ = position === 'yes' ? qYes : qNo;
  const otherQ = position === 'yes' ? qNo : qYes;

  let low = 0;
  let high = coins / 0.01;
  let mid, cost;

  while (high - low > 0.001) {
    mid = (low + high) / 2;
    cost = costFunction(currentQ + mid, otherQ, b) - costFunction(currentQ, otherQ, b);

    if (cost < coins) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return low;
}

/**
 * Calculate cost to buy a specific number of shares.
 */
export function calculateCost(qYes, qNo, b, position, shares) {
  if (position === 'yes') {
    return costFunction(qYes + shares, qNo, b) - costFunction(qYes, qNo, b);
  }
  return costFunction(qYes, qNo + shares, b) - costFunction(qYes, qNo, b);
}

/**
 * Calculate revenue from selling shares back to the AMM.
 */
export function calculateSellRevenue(qYes, qNo, b, position, shares) {
  if (position === 'yes') {
    return costFunction(qYes, qNo, b) - costFunction(qYes - shares, qNo, b);
  }
  return costFunction(qYes, qNo, b) - costFunction(qYes, qNo - shares, b);
}
