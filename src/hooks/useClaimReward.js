import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export function useClaimReward() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const setRewardStatus = useAuthStore((s) => s.setRewardStatus);
  const addToast = useUIStore((s) => s.addToast);
  const addAchievement = useUIStore((s) => s.addAchievement);
  const triggerLevelUpModal = useUIStore((s) => s.triggerLevelUpModal);

  return useMutation({
    mutationFn: () => api.post('/claim-reward', {}),

    onSuccess: (response) => {
      if (response.user_coins !== undefined) {
        updateUser({
          coins: response.user_coins,
          xp: response.user_xp,
          rank: response.new_rank,
        });
      }

      // Update reward status so the banner disappears immediately
      const todayStr = new Date().toISOString().split('T')[0];
      setRewardStatus({
        can_claim: false,
        is_active: true,
        rank: response.new_rank,
        coins: response.coins_awarded,
        xp: response.xp_awarded,
        is_sunday: response.is_sunday,
        last_claim: todayStr,
      });

      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });

      addToast('success', {
        title: 'Daily Reward Claimed!',
        message: `+${response.coins_awarded} coins, +${response.xp_awarded} XP${response.is_sunday ? ' (3x Sunday)' : ''}`,
        coins: response.coins_awarded,
      });

      if (response.achievements?.length > 0) {
        for (const ach of response.achievements) {
          addAchievement(ach);
        }
      }

      if (response.completedQuests?.length > 0) {
        for (const q of response.completedQuests) {
          addToast('success', {
            title: `Quest Complete: ${q.title}`,
            message: `+${q.xp_reward} XP, +${q.coin_reward} coins`,
          });
        }
      }

      if (response.levelUp?.leveledUp) {
        triggerLevelUpModal({
          oldLevel: response.levelUp.oldLevel,
          newLevel: response.levelUp.newLevel,
          unlocks: response.levelUp.unlocks,
        });
      }
    },

    onError: (error) => {
      addToast('error', {
        title: 'Claim Failed',
        message: error.message,
      });
    },
  });
}
