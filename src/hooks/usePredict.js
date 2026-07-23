import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

/**
 * Mutation hook for placing a prediction.
 * Automatically updates local user state and invalidates related queries.
 */
export function usePredict() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data) => api.post('/predict', data),

    onSuccess: (response) => {
      // Update local user state
      if (response.user_coins !== undefined) {
        updateUser({
          coins: response.user_coins,
          xp: response.user_xp,
          rank: response.user_rank,
        });
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });

      // Show prediction toast
      addToast('prediction', {
        title: 'Prediction Placed!',
        message: `${response.shares?.toFixed(1)} shares @ ${response.entry_price?.toFixed(3)}`,
        coins: -response.coins_spent,
      });
    },

    onError: (error) => {
      addToast('error', {
        title: 'Prediction Failed',
        message: error.message,
      });
    },
  });
}
