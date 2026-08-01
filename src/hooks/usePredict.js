import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export function usePredict() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const addAchievement = useUIStore((s) => s.addAchievement);
  const triggerLevelUpModal = useUIStore((s) => s.triggerLevelUpModal);

  // Defensive: only show the modal when the new level is above the current one.
  // (user here is the pre-update value from the store closure)
  const shouldTriggerLevelUp = (levelUp) =>
    levelUp?.leveledUp && levelUp.newLevel > (user?.level || 0);

  return useMutation({
    mutationFn: (data) => api.post('/predict', data),

    onMutate: async (data) => {
      const totalCost = data.coins * data.confidence;
      const previousUser = user ? { ...user } : null;
      if (user) {
        updateUser({ coins: user.coins - totalCost });
      }
      return { previousUser };
    },

    onSuccess: (response, variables, context) => {
      if (response.user_coins !== undefined) {
        updateUser({
          coins: response.user_coins,
          xp: response.user_xp,
          rank: response.user_rank,
          level: response.user_level,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['market', variables.market_id] });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });

      addToast('prediction', {
        title: 'Prediction Placed!',
        message: `${response.shares?.toFixed(1)} shares @ ${response.entry_price?.toFixed(3)}`,
        coins: -response.coins_spent,
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

      if (shouldTriggerLevelUp(response.levelUp)) {
        triggerLevelUpModal({
          oldLevel: response.levelUp.oldLevel,
          newLevel: response.levelUp.newLevel,
          unlocks: response.levelUp.unlocks,
        });
      }
    },

    onError: (error, variables, context) => {
      if (context?.previousUser) {
        updateUser(context.previousUser);
      }

      addToast('error', {
        title: 'Prediction Failed',
        message: error.message,
      });
    },
  });
}
