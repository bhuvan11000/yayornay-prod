import { createClient } from '@supabase/supabase-js';

/**
 * Supabase admin client using the service role key.
 * ONLY used in Netlify Functions — NEVER in frontend code.
 * Bypasses RLS so all business logic must be in PostgreSQL functions
 * or validated here before writing.
 */
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
