import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export function useSell() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const triggerRankUpModal = useUIStore((s) => s.triggerRankUpModal);

  return useMutation({
    mutationFn: (data) => api.post('/sell', data),

    onMutate: async (data) => {
      const previousUser = user ? { ...user } : null;
      return { previousUser };
    },

    onSuccess: (response) => {
      if (response.user_coins !== undefined) {
        updateUser({ coins: response.user_coins });
      }

      if (response.rankUp?.rankedUp) {
        updateUser({ rank: response.rankUp.newRank });
        triggerRankUpModal(response.rankUp);
      }

      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });

      addToast('success', {
        title: 'Shares Sold',
        message: `Received ${response.coins_received} coins`,
        coins: response.coins_received,
      });
    },

    onError: (error, variables, context) => {
      if (context?.previousUser) {
        updateUser(context.previousUser);
      }

      addToast('error', {
        title: 'Sell Failed',
        message: error.message,
      });
    },
  });
}