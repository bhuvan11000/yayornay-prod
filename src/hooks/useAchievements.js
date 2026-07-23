import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';

/**
 * Fetch all achievements with unlock status for the current user.
 */
export function useAchievements() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      // Get all achievements
      const { data: allAchievements, error: aError } = await supabase
        .from('achievements')
        .select('*')
        .order('slug', { ascending: true });

      if (aError) throw aError;

      // Get unlocked achievements for the user
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      const unlockedMap = {};
      if (userAchievements) {
        userAchievements.forEach((ua) => {
          unlockedMap[ua.achievement_id] = ua.unlocked_at;
        });
      }

      // Merge
      return (allAchievements || []).map((a) => ({
        ...a,
        unlocked: !!unlockedMap[a.id],
        unlocked_at: unlockedMap[a.id] || null,
      }));
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}
