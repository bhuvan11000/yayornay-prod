import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

/**
 * Hook for disputing a resolved market.
 * Returns mutation + modal state helpers.
 */
export function useDispute(marketId) {
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      return api.post('/dispute', { market_id: marketId, reason });
    },
    onSuccess: () => {
      setReason('');
    },
  });

  return {
    reason,
    setReason,
    submitDispute: mutation.mutate,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
