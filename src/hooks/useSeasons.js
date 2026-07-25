import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';

/**
 * Fetch the currently active season.
 */
export function useSeasons() {
  return useQuery({
    queryKey: ['seasons', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
