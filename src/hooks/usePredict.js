import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export function usePredict() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const showLevelUpModal = useUIStore((s) => s.showLevelUpModal);

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
        });
      }

      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['market', variables.market_id] });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });

      addToast('prediction', {
        title: 'Prediction Placed!',
        message: `${response.shares?.toFixed(1)} shares @ ${response.entry_price?.toFixed(3)}`,
        coins: -response.coins_spent,
      });

      if (response.achievements?.length > 0) {
        for (const ach of response.achievements) {
          addToast('achievement', {
            title: `Achievement Unlocked: ${ach.title}`,
            message: ach.description,
          });
        }
      }

      if (response.levelUp?.leveledUp) {
        showLevelUpModal({
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