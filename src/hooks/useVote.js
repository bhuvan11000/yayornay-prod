import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUIStore } from '../stores/uiStore';

export function useVote() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (data) => api.post('/community-vote', data),

    onMutate: async ({ proposal_id, vote }) => {
      await queryClient.cancelQueries({ queryKey: ['proposals'] });
      const previousData = queryClient.getQueryData(['proposals']);

      queryClient.setQueryData(['proposals'], (old) => {
        if (!old) return old;
        return old.map((p) => {
          if (p.id === proposal_id) {
            return {
              ...p,
              upvotes: vote === 'up' ? (p.upvotes || 0) + 1 : p.upvotes,
              downvotes: vote === 'down' ? (p.downvotes || 0) + 1 : p.downvotes,
              user_vote: vote,
            };
          }
          return p;
        });
      });

      return { previousData };
    },

    onSuccess: (response, variables) => {
      if (response.proposal_status !== 'pending') {
        queryClient.invalidateQueries({ queryKey: ['proposals'] });
        queryClient.invalidateQueries({ queryKey: ['markets'] });

        if (response.market_created) {
          addToast('success', {
            title: 'Market Approved!',
            message: 'Proposal reached 15 votes and is now live.',
          });
        }
      }
    },

    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['proposals'], context.previousData);
      }
      addToast('error', {
        title: 'Vote Failed',
        message: error.message,
      });
    },
  });
}
