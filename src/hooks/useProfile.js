import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useProfile(username) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const data = await api.get(`/user/${encodeURIComponent(username)}`);
      return data;
    },
    enabled: !!username,
    staleTime: 30 * 1000,
  });
}
