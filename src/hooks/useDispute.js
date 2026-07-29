import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook for disputing a resolved market.
 * Checks existing disputes on mount so the form hides on reload.
 */
export function useDispute(marketId) {
  const [reason, setReason] = useState('');
  const user = useAuthStore(s => s.user);

  // Check if user already disputed this market (persists across reloads)
  const existingQuery = useQuery({
    queryKey: ['user-dispute', marketId, user?.id],
    queryFn: async () => {
      if (!user?.id || !marketId) return false;
      const { data } = await supabase
        .from('market_disputes')
        .select('id')
        .eq('market_id', marketId)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!marketId && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return api.post('/dispute', { market_id: marketId, reason });
    },
    onSuccess: () => {
      setReason('');
      existingQuery.refetch();
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
    hasDisputed: existingQuery.data ?? false,
  };
}
