import { createClient } from '@supabase/supabase-js';
import { WebSocket as WS } from 'ws';

// Netlify Lambda runs Node 20 which has no native WebSocket.
// @supabase/realtime-js requires WebSocket at createClient() time.
// Polyfill it so all functions work without needing Node 22+.
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WS;
}

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
