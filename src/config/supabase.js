import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasConfig = supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co' && supabaseAnonKey;

/**
 * Supabase client initialized with the anon key.
 * Used for READ operations directly from the frontend.
 * All WRITE operations go through Netlify Functions.
 *
 * Gracefully handles missing config so the app doesn't crash
 * in development without environment variables set.
 */
export const supabase = hasConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Check if Supabase is configured.
 */
export const isSupabaseConfigured = () => !!supabase;
