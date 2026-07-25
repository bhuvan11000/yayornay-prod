import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';

/**
 * Fetch active and completed quests for the current user.
 * Returns daily and weekly quests with progress.
 * On first fetch with no active quests, calls API to assign them.
 */
export function useQuests() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['quests', user?.id],
    queryFn: async () => {
      const now = new Date().toISOString();

      // Fetch active (non-expired, not completed) quests
      const { data: active, error: activeError } = await supabase
        .from('user_quests')
        .select(`
          *,
          quest:quest_id(title, description, type, action_type, target, xp_reward, coin_reward)
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .gte('reset_at', now)
        .order('assigned_at', { ascending: false });

      if (activeError) throw activeError;

      // Fetch completed quests (completed or expired)
      const { data: completed } = await supabase
        .from('user_quests')
        .select(`
          *,
          quest:quest_id(title, description, type, action_type, target, xp_reward, coin_reward)
        `)
        .eq('user_id', user.id)
        .eq('completed', true)
        .order('assigned_at', { ascending: false });

      // Merge quest data into a flat structure
      const mapQuest = (uq) => ({
        ...uq.quest,
        id: uq.id,
        quest_id: uq.quest_id,
        progress: uq.progress,
        completed: uq.completed,
        assigned_at: uq.assigned_at,
        reset_at: uq.reset_at,
      });

      const activeQuests = (active || []).map(mapQuest);
      const completedQuests = (completed || []).map(mapQuest);

      // If no active quests, try to assign them via API
      if (activeQuests.length === 0) {
        try {
          await api.post('/assign-quests', {});
          // Refetch after assignment
          const { data: refetched } = await supabase
            .from('user_quests')
            .select(`
              *,
              quest:quest_id(title, description, type, action_type, target, xp_reward, coin_reward)
            `)
            .eq('user_id', user.id)
            .eq('completed', false)
            .gte('reset_at', now)
            .order('assigned_at', { ascending: false });

          if (refetched && refetched.length > 0) {
            activeQuests.push(...refetched.map(mapQuest));
          }
        } catch (err) {
          console.warn('Failed to assign quests:', err.message);
        }
      }

      const daily = activeQuests.filter((q) => q.type === 'daily');
      const weekly = activeQuests.filter((q) => q.type === 'weekly');

      return {
        daily,
        weekly,
        all: activeQuests,
        completed: completedQuests,
        hasActive: activeQuests.length > 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
