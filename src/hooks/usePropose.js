import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUIStore } from '../stores/uiStore';

/**
 * Mutation hook for proposing a community market.
 */
export function usePropose() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data) => api.post('/community-propose', data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });

      addToast('success', {
        title: 'Proposal Submitted',
        message: 'Your market is pending community votes.',
      });
    },

    onError: (error) => {
      addToast('error', {
        title: 'Proposal Failed',
        message: error.message,
      });
    },
  });
}
