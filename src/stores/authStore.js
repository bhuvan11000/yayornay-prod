import { create } from 'zustand';
import { supabase } from '../config/supabase';

/**
 * Auth state store using Zustand.
 *
 * See database_auth_ui.md Part 2 (Authentication) for the full
 * implementation reference.
 *
 * This store manages:
 * - User profile (from public.users)
 * - Supabase auth session
 * - Loading state during initialization
 * - Daily reward eligibility status
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  rewardStatus: null,

  /**
   * Initialize the auth store on app mount.
   * Checks for existing session and fetches user profile.
   */
  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      try {
        const res = await fetch('/.netlify/functions/login', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
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
        console.error('Failed to fetch profile on init:', err);
      }
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
   * @param {object} status - { can_claim, is_active, last_claim }
   */
  setRewardStatus: (status) => {
    set({ rewardStatus: status });
  },

  /**
   * Log out the current user.
   */
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, rewardStatus: null });
  },
}));
