import { useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';

/**
 * Subscribe to real-time market price updates for a specific market.
 *
 * @param {string} marketId - Market UUID
 */
export function useMarketRealtime(marketId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!marketId) return;

    const channel = supabase
      .channel(`market:${marketId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'markets',
        filter: `id=eq.${marketId}`,
      }, (payload) => {
        // Update the cached market data instantly
        queryClient.setQueryData(['market', marketId], (old) => {
          if (!old) return old;
          return {
            ...old,
            yes_price: payload.new.yes_price,
            no_price: payload.new.no_price,
            volume: payload.new.volume,
            participant_count: payload.new.participant_count,
            status: payload.new.status,
          };
        });

        // Also update in the markets list cache
        queryClient.setQueriesData({ queryKey: ['markets'] }, (old) => {
          if (!old?.markets) return old;
          return {
            ...old,
            markets: old.markets.map((m) =>
              m.id === marketId
                ? {
                    ...m,
                    yes_price: payload.new.yes_price,
                    no_price: payload.new.no_price,
                    volume: payload.new.volume,
                    participant_count: payload.new.participant_count,
                    status: payload.new.status,
                  }
                : m
            ),
          };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId, queryClient]);
}

/**
 * Subscribe to real-time user updates (coins, XP, rank changes).
 */
export function useUserRealtime() {
  const userId = useAuthStore((s) => s.user?.id);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        updateUser({
          coins: payload.new.coins,
          xp: payload.new.xp,
          level: payload.new.level,
          rank: payload.new.rank,
          betting_streak: payload.new.betting_streak,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, updateUser]);
}
