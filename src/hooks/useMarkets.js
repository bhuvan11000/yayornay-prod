import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

export function useMarkets({ category, status, source, sort = 'created_at', page = 1, limit = 20 } = {}) {
  return useQuery({
    queryKey: ['markets', { category, status, source, sort, page, limit }],
    queryFn: async () => {
      let query = supabase
        .from('markets')
        .select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (source) {
        query = query.eq('source', source);
      }

      const sortMap = {
        created_at: ['created_at', { ascending: false }],
        volume: ['volume', { ascending: false }],
        closes_at: ['closes_at', { ascending: true }],
      };
      const [sortCol, sortOpts] = sortMap[sort] || sortMap.created_at;
      query = query.order(sortCol, sortOpts);

      const from = (page - 1) * limit;
      const to = page * limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      return { markets: data || [], count: count ?? 0 };
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}