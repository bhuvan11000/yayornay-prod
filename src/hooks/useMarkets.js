import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

/**
 * Fetch a paginated list of markets with optional filters.
 *
 * @param {object} options
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.status='open'] - Market status
 * @param {number} [options.page=1] - Page number
 */
export function useMarkets({ category, status = 'open', page = 1 } = {}) {
  return useQuery({
    queryKey: ['markets', { category, status, page }],
    queryFn: async () => {
      let query = supabase
        .from('markets')
        .select('*', { count: 'exact' })
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range((page - 1) * 20, page * 20 - 1);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { markets: data, count };
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
