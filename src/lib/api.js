import { supabase } from '../config/supabase';

const BASE = '/.netlify/functions';

/**
 * API wrapper for Netlify Functions.
 * Automatically attaches the Supabase auth token.
 */
export const api = {
  /**
   * POST request to a Netlify Function.
   * @param {string} endpoint - e.g., '/predict'
   * @param {object} body - Request body
   */
  async post(endpoint, body) {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token
          ? { 'Authorization': `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  /**
   * GET request to a Netlify Function.
   * @param {string} endpoint - e.g., '/leaderboard'
   * @param {object} params - Query parameters
   */
  async get(endpoint, params = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const query = new URLSearchParams(params).toString();
    const url = query ? `${BASE}${endpoint}?${query}` : `${BASE}${endpoint}`;

    const res = await fetch(url, {
      headers: {
        ...(session?.access_token
          ? { 'Authorization': `Bearer ${session.access_token}` }
          : {}),
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
};
