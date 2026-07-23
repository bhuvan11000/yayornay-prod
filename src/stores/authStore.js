import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { getRankColor } from '../lib/ranks';

/**
 * Auth state store using Zustand.
 *
 * Manages:
 * - User profile (from public.users)
 * - Supabase auth session
 * - Loading state during initialization
 * - Daily reward eligibility status
 *
 * Supabase JS client auto-handles:
 * - Storing refresh token in localStorage
 * - Keeping access token in memory
 * - Auto-refreshing access token before expiry
 * - Emitting onAuthStateChange events
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  rewardStatus: null,

  /**
   * Returns true when a user is authenticated (has a profile).
   */
  getIsAuthenticated: () => Boolean(get().user),

  /**
   * Returns CSS color string for the current user's rank.
   */
  getRankColor: () => {
    const user = get().user;
    return user?.rank ? getRankColor(user.rank) : '#5c6370';
  },

  /**
   * Initialize the auth store on app mount.
   * Checks for existing session and subscribes to auth state changes.
   */
  initialize: async () => {
    try {
      if (!supabase) {
        console.warn('Supabase not configured — skipping auth init');
        set({ loading: false });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        await get().handleSession(session);
      } else {
        set({ loading: false });
      }

      // Subscribe to auth state changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null, session: null, rewardStatus: null });
        } else if (event === 'TOKEN_REFRESHED') {
          set({ session });
        } else if (event === 'SIGNED_IN' && session) {
          get().handleSession(session);
        }
      });
    } catch (err) {
      console.error('Auth init error:', err);
      set({ loading: false });
    }
  },

  /**
   * Process an existing session: call login endpoint to get user profile.
   * Called both on init and on SIGNED_IN events.
   */
  handleSession: async (session) => {
    try {
      // 1. Try Netlify function (works in production / Netlify Dev)
      const res = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 404) {
        // Profile doesn't exist yet — first sign-up, call onboard
        const onboardRes = await fetch('/.netlify/functions/onboard', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (onboardRes.ok) {
          const onboardData = await onboardRes.json();
          set({
            session,
            user: onboardData.user,
            rewardStatus: {
              can_claim: true,
              is_active: false,
              rank: 'Unranked',
            },
            loading: false,
          });
          return;
        }
      } else if (res.ok) {
        const data = await res.json();
        set({
          session,
          user: data.user,
          rewardStatus: data.rewardStatus,
          loading: false,
        });
        return;
      }
    } catch (err) {
      console.warn('Netlify function unavailable, using direct Supabase fallback:', err.message);
    }

    // 2. Fallback: query Supabase directly (works in dev without Netlify Dev)
    try {
      if (supabase) {
        // Try to fetch existing profile
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData && !fetchError) {
          set({
            session,
            user: userData,
            loading: false,
          });
          return;
        }

        // Profile doesn't exist — try to create one (first sign-up)
        const shortId = session.user.id.substring(0, 6);
        const username = `Player_${shortId}`;

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            username,
            avatar_url: null,
            level: 1,
            xp: 0,
            coins: 1000,
            rank: 'Unranked',
            total_predictions: 0,
            correct_predictions: 0,
            accuracy: 0.0,
            net_profit: 0,
            betting_streak: 0,
            longest_streak: 0,
            last_bet_date: null,
            last_login: new Date().toISOString(),
            last_reward_claim: null,
          })
          .select()
          .single();

        if (newUser && !insertError) {
          set({
            session,
            user: newUser,
            rewardStatus: {
              can_claim: true,
              is_active: false,
              rank: 'Unranked',
            },
            loading: false,
          });
          return;
        }
      }
    } catch (err) {
      console.error('Direct Supabase fallback also failed:', err);
    }

    set({ loading: false });
  },

  /**
   * Update user profile data (e.g., after prediction or XP change).
   * @param {object} updates - Partial user object
   */
  updateUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }));
  },

  /**
   * Update reward status.
   * @param {object} status
   */
  setRewardStatus: (status) => {
    set({ rewardStatus: status });
  },

  /**
   * Log out the current user.
   */
  logout: async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
    set({ user: null, session: null, rewardStatus: null });
  },
}));
