import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Supabase client initialized with the anon key.
 * Used for READ operations directly from the frontend.
 * All WRITE operations go through Netlify Functions.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
