/**
 * Formatting utilities for numbers, dates, and currency.
 */

/**
 * Format coin amounts with commas.
 * @param {number} n
 * @returns {string}
 */
export function formatCoins(n) {
  if (n == null || isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

/**
 * Format XP amounts.
 * @param {number} n
 * @returns {string}
 */
export function formatXP(n) {
  if (n == null || isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

/**
 * Format a decimal as a percentage.
 * @param {number} n - Value between 0 and 1
 * @returns {string}
 */
export function formatPercent(n) {
  if (n == null || isNaN(n)) return '0%';
  return `${Math.round(n * 100)}%`;
}

/**
 * Format a date for display.
 * @param {string|Date} d - ISO date string or Date object
 * @returns {string}
 */
export function formatDate(d) {
  if (!d) return 'N/A';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date with time.
 * @param {string|Date} d
 * @returns {string}
 */
export function formatDateTime(d) {
  if (!d) return 'N/A';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time remaining from an ISO date string.
 * Returns something like "3d 14h" or "2h 30m" or "Expired".
 * @param {string} isoDate
 * @returns {string}
 */
export function formatTimeRemaining(isoDate) {
  if (!isoDate) return 'N/A';

  const now = new Date();
  const target = new Date(isoDate);
  const diff = target - now;

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Truncate a string to a max length.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateAddress(str, maxLength = 12) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;
}

/**
 * Simple pluralization helper.
 * @param {number} n
 * @param {string} word
 * @param {string} [plural]
 * @returns {string}
 */
export function pluralize(n, word, plural) {
  if (n === 1) return `${n} ${word}`;
  return `${n} ${plural || `${word}s`}`;
}

/**
 * Format price as cents (e.g., 0.62 -> "62c").
 * @param {number} price
 * @returns {string}
 */
export function formatPrice(price) {
  if (price == null || isNaN(price)) return 'N/A';
  return `${Math.round(price * 100)}c`;
}

/**
 * Get display label for a market source.
 * @param {string} source - Market source ('ai', 'admin', 'community')
 * @returns {string}
 */
export function formatSource(source) {
  if (source === 'ai') return 'Daily';
  if (source === 'admin') return 'Admin';
  return 'Community';
}
