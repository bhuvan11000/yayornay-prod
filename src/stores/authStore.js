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
    return user?.rank ? getRankColor(user.rank) : '#ffffff';
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
        } else if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
          // USER_UPDATED fires when an email confirmation link is clicked.
          // SIGNED_IN fires on normal login. Both need the same session handling.
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
            user: { ...onboardData.user, email: session.user.email },
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
          user: { ...data.user, email: session.user.email },
          rewardStatus: data.rewardStatus,
          loading: false,
        });
        return;
      }
    } catch (err) {
      console.warn('Netlify function unavailable, trying direct Supabase query:', err.message);
    }

    // 2. Fallback: query Supabase directly (development without Netlify Dev)
    //    Only reads — we never write from the client (no INSERT/UPDATE policies).
    //    For first-time sign-ups, the onboard Netlify function must be available.
    try {
      if (supabase) {
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData && !fetchError) {
          set({
            session,
            user: { ...userData, email: session.user.email },
            rewardStatus: {
              can_claim: true,
              is_active: false,
              rank: userData.rank,
            },
            loading: false,
          });
          return;
        }

        // User not found in public.users — they need the onboard function.
        console.warn(
          'No user profile found in database. ' +
          'For first-time sign-up, run: netlify dev'
        );
      }
    } catch (err) {
      console.error('Direct Supabase query fallback failed:', err);
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
