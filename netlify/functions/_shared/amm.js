/**
 * LMSR (Logarithmic Market Scoring Rule) AMM math.
 * Used for computing prices, costs, and share quantities.
 *
 * All prices are in the range [0, 1], values are unitless shares.
 * b = liquidity parameter (default 100 for all markets).
 */

/**
 * Cost function: C(q_yes, q_no) = b * ln(e^(q_yes/b) + e^(q_no/b))
 */
export function costFunction(qYes, qNo, b) {
  return b * Math.log(Math.exp(qYes / b) + Math.exp(qNo / b));
}

/**
 * Get current price for a given side.
 *
 * @param {number} qYes - Total YES shares outstanding
 * @param {number} qNo - Total NO shares outstanding
 * @param {number} b - Liquidity parameter
 * @param {'yes'|'no'} side - Which side to get price for
 * @returns {number} Price between 0 and 1
 */
export function getPrice(qYes, qNo, b, side) {
  const expYes = Math.exp(qYes / b);
  const expNo = Math.exp(qNo / b);
  const total = expYes + expNo;

  if (total === 0) return 0.5;

  if (side === 'yes') return expYes / total;
  return expNo / total;
}

/**
 * Calculate the number of shares received for a given cost.
 * Uses binary search since there's no closed-form inverse.
 *
 * @param {number} qYes - Current YES shares
 * @param {number} qNo - Current NO shares
 * @param {number} b - Liquidity parameter
 * @param {'yes'|'no'} position - Side to buy
 * @param {number} coins - Amount of coins to spend
 * @returns {number} Number of shares received
 */
export function calculateShares(qYes, qNo, b, position, coins) {
  const currentQ = position === 'yes' ? qYes : qNo;
  const otherQ = position === 'yes' ? qNo : qYes;

  let low = 0;
  let high = coins / 0.01; // Max possible shares (at price 0.01)
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
 * Calculate the cost to buy a specific number of shares.
 *
 * @param {number} qYes - Current YES shares
 * @param {number} qNo - Current NO shares
 * @param {number} b - Liquidity parameter
 * @param {'yes'|'no'} position - Side to buy
 * @param {number} shares - Number of shares to buy
 * @returns {number} Cost in coins
 */
export function calculateCost(qYes, qNo, b, position, shares) {
  if (position === 'yes') {
    return costFunction(qYes + shares, qNo, b) - costFunction(qYes, qNo, b);
  }
  return costFunction(qYes, qNo + shares, b) - costFunction(qYes, qNo, b);
}

/**
 * Calculate the revenue from selling shares back to the AMM.
 *
 * @param {number} qYes - Current YES shares
 * @param {number} qNo - Current NO shares
 * @param {number} b - Liquidity parameter
 * @param {'yes'|'no'} position - Side to sell
 * @param {number} shares - Number of shares to sell
 * @returns {number} Revenue in coins
 */
export function calculateSellRevenue(qYes, qNo, b, position, shares) {
  if (position === 'yes') {
    return costFunction(qYes, qNo, b) - costFunction(qYes - shares, qNo, b);
  }
  return costFunction(qYes, qNo, b) - costFunction(qYes, qNo - shares, b);
}

/**
 * Calculate new prices after a trade.
 *
 * @param {number} qYes - Current YES shares
 * @param {number} qNo - Current NO shares
 * @param {number} b - Liquidity parameter
 * @returns {{ yesPrice: number, noPrice: number }}
 */
export function getNewPrices(qYes, qNo, b) {
  const yesPrice = getPrice(qYes, qNo, b, 'yes');
  const noPrice = 1 - yesPrice;
  return { yesPrice, noPrice };
}
