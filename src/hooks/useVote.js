import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/**
 * Mutation hook for voting on a community proposal.
 */
export function useVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/community-vote', data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },

    onError: (error) => {
      console.error('Vote failed:', error);
    },
  });
}
