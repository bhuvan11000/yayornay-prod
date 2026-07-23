import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

export function useMarket(marketId) {
  return useQuery({
    queryKey: ['market', marketId],
    queryFn: async () => {
      const { data: market, error: marketError } = await supabase
        .from('markets')
        .select('*')
        .eq('id', marketId)
        .single();

      if (marketError) throw marketError;

      const { data: priceHistory } = await supabase
        .from('market_price_history')
        .select('yes_price, no_price, volume, recorded_at')
        .eq('market_id', marketId)
        .order('recorded_at', { ascending: true });

      const { data: predictions } = await supabase
        .from('predictions')
        .select('position, shares')
        .eq('market_id', marketId)
        .eq('result', 'pending');

      const distMap = {};
      let totalPlayers = 0;
      let totalShares = 0;
      for (const p of predictions || []) {
        if (!distMap[p.position]) distMap[p.position] = { position: p.position, count: 0, total_shares: 0 };
        distMap[p.position].count += 1;
        distMap[p.position].total_shares += p.shares;
        totalPlayers += 1;
        totalShares += p.shares;
      }
      const distribution = Object.values(distMap).map((d) => ({
        ...d,
        percentage: totalPlayers > 0 ? Math.round((d.count / totalPlayers) * 100) : 0,
      }));

      return {
        market,
        priceHistory: priceHistory || [],
        distribution: distribution || [],
      };
    },
    enabled: !!marketId,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}