import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

/**
 * Fetch a user's public profile by username.
 *
 * @param {string} username
 */
export function useProfile(username) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      // Fetch user
      const { data: user, error: uError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (uError) throw uError;

      // Fetch recent predictions
      const { data: predictions } = await supabase
        .from('predictions')
        .select(`
          *,
          market:market_id(title, category, status, resolution, yes_price, no_price)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch unlocked achievements
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select(`
          achievement:achievement_id(slug, title, description, icon),
          unlocked_at
        `)
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      // Fetch seasonal badges
      const { data: badges } = await supabase
        .from('seasonal_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('season_number', { ascending: false });

      return {
        user,
        predictions: predictions || [],
        achievements: achievements?.map((a) => ({ ...a.achievement, unlocked_at: a.unlocked_at })) || [],
        badges: badges || [],
      };
    },
    enabled: !!username,
    staleTime: 30 * 1000,
  });
}
