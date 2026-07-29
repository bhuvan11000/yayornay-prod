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
            const prevVote = p.user_vote;
            let up = p.upvotes || 0;
            let down = p.downvotes || 0;

            // Remove previous vote if any
            if (prevVote === 'up') up = Math.max(0, up - 1);
            if (prevVote === 'down') down = Math.max(0, down - 1);

            if (prevVote === vote) {
              // Toggle off — no new vote
              return { ...p, upvotes: up, downvotes: down, user_vote: null };
            }

            // Add new vote (or switch)
            if (vote === 'up') up += 1;
            if (vote === 'down') down += 1;

            return { ...p, upvotes: up, downvotes: down, user_vote: vote };
          }
          return p;
        });
      });

      return { previousData };
    },

    onSuccess: (response, variables) => {
      // If vote was toggled off, invalidate to get fresh counts from server
      if (response.vote_removed || response.vote_changed) {
        queryClient.invalidateQueries({ queryKey: ['proposals'] });
      }

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
