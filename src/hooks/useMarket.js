import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

/**
 * Fetch a single market by ID, including price history.
 *
 * @param {string} marketId
 */
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

      return { ...market, price_history: priceHistory || [] };
    },
    enabled: !!marketId,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}
