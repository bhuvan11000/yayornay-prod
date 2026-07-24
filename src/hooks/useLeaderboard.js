import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/**
 * Fetch leaderboard data via the Netlify function.
 *
 * @param {object} options
 * @param {'coins'|'accuracy'|'profit'|'streak'} [options.metric='coins']
 * @param {'all'|'month'|'week'} [options.timeframe='all']
 * @param {number} [options.page=1]
 * @param {number} [options.limit=50]
 */
export function useLeaderboard({ metric = 'coins', timeframe = 'all', page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ['leaderboard', { metric, timeframe, page, limit }],
    queryFn: async () => {
      const data = await api.get('/leaderboard', { metric, timeframe, limit, offset });
      return {
        players: data.players || [],
        totalCount: data.totalCount || 0,
        userRank: data.userRank ?? null,
      };
    },
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
}