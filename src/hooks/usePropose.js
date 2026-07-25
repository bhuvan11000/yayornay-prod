import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export function usePropose() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const user = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data) => api.post('/community-propose', data),

    onMutate: async () => {
      return { previousCoins: user?.coins };
    },

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });

      if (response.stake_deducted && user) {
        updateUser({ coins: user.coins - response.stake_deducted });
      }

      addToast('success', {
        title: 'Proposal Submitted',
        message: 'Your market is pending community votes.',
      });
    },

    onError: (error, variables, context) => {
      if (context?.previousCoins != null && user) {
        updateUser({ coins: context.previousCoins });
      }

      addToast('error', {
        title: 'Proposal Failed',
        message: error.message,
      });
    },
  });
}
