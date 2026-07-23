import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify a Bearer JWT token from the Authorization header.
 * Returns the user object if valid, null otherwise.
 *
 * @param {Request} req - The incoming Netlify Function request
 * @returns {Promise<object|null>} The authenticated user or null
 */
export async function verifyAuth(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return user;
}

/**
 * Verify the cron secret header for cron-triggered functions.
 * These functions have no user JWT — they're called by GitHub Actions.
 *
 * @param {Request} req - The incoming Netlify Function request
 * @returns {boolean} Whether the cron secret is valid
 */
export function verifyCronSecret(req) {
  const secret = req.headers.get('x-cron-secret');
  return secret === process.env.CRON_SECRET;
}
