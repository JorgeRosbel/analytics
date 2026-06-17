import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Site {
  id: number;
  domain: string;
  name: string | null;
  created_at: number;
}

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async () => (await api.get<{ sites: Site[] }>('/sites')).data.sites,
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { domain: string; name?: string }) =>
      (await api.post<{ site: Site }>('/sites', input)).data.site,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sites'] }),
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/sites/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sites'] }),
  });
}
