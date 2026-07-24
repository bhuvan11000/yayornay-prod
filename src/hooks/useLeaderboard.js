import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../config/supabase';

/**
 * Fetch leaderboard data with optional metric and timeframe.
 *
 * @param {object} options
 * @param {'coins'|'accuracy'|'profit'|'streak'} [options.metric='coins']
 * @param {'all'|'month'|'week'} [options.timeframe='all']
 * @param {number} [options.limit=50]
 * @param {number} [options.offset=0]
 */
export function useLeaderboard({ metric = 'coins', timeframe = 'all', limit = 50, offset = 0 } = {}) {
  return useQuery({
    queryKey: ['leaderboard', { metric, timeframe, limit, offset }],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return [];
      }

      let query = supabase.from('users').select('*', { count: 'exact' });

      switch (metric) {
        case 'accuracy':
          query = query.gte('total_predictions', 20).order('accuracy', { ascending: false });
          break;
        case 'profit':
          query = query.order('net_profit', { ascending: false });
          break;
        case 'streak':
          query = query.gt('betting_streak', 0).order('betting_streak', { ascending: false });
          break;
        case 'coins':
        default:
          query = query.gte('coins', 2500).order('coins', { ascending: false });
          break;
      }

      const { data, error } = await query
        .range(offset, offset + limit - 1)
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
