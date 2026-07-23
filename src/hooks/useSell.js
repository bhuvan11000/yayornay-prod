import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

/**
 * Mutation hook for selling prediction shares.
 */
export function useSell() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data) => api.post('/sell', data),

    onSuccess: (response) => {
      if (response.user_coins !== undefined) {
        updateUser({ coins: response.user_coins });
      }

      queryClient.invalidateQueries({ queryKey: ['markets'] });
      queryClient.invalidateQueries({ queryKey: ['predictions'] });

      addToast('success', {
        title: 'Shares Sold',
        message: `Received ${response.coins_received} coins`,
        coins: response.coins_received,
      });
    },

    onError: (error) => {
      addToast('error', {
        title: 'Sell Failed',
        message: error.message,
      });
    },
  });
}
