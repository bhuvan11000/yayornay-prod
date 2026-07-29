import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';

/**
 * Fetch predictions for the current user.
 * Optionally filter by market.
 *
 * @param {object} options
 * @param {string} [options.marketId] - Filter by market
 */
export function usePredictions({ marketId } = {}) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['predictions', { marketId, userId: user?.id }],
    queryFn: async () => {
      let query = supabase
        .from('predictions')
        .select(`
          *,
          market:market_id(title, category, status, resolution, yes_price, no_price, resolved_at, closes_at)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}
