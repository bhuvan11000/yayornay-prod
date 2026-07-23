import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';

/**
 * Fetch active quests for the current user.
 * Returns daily and weekly quests with progress.
 */
export function useQuests() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['quests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_quests')
        .select(`
          *,
          quest:quest_id(title, description, type, action_type, target, xp_reward, coin_reward)
        `)
        .eq('user_id', user.id)
        .gt('reset_at', new Date().toISOString())
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      // Split into daily and weekly
      const daily = (data || []).filter((uq) => uq.quest?.type === 'daily');
      const weekly = (data || []).filter((uq) => uq.quest?.type === 'weekly');

      return { daily, weekly, all: data || [] };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
