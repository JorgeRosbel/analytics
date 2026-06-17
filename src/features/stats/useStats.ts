import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface StatsResponse {
  siteId: number;
  domain: string;
  from: number;
  to: number;
  granularity: 'hour' | 'day';
  totalViews: number;
  timeseries: { bucket: string; views: number }[];
  topPaths: { path: string; views: number }[];
  topReferrers: { referrer: string; views: number }[];
  topCountries: { country: string; views: number }[];
}

export interface StatsFilters {
  country?: string;
  path?: string;
  referrer?: string;
}

export function useStats(siteId: number, from: number, to: number, filters: StatsFilters) {
  return useQuery({
    queryKey: ['stats', siteId, from, to, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        siteId: String(siteId),
        from: String(from),
        to: String(to),
      });
      if (filters.country) params.set('country', filters.country);
      if (filters.path) params.set('path', filters.path);
      if (filters.referrer) params.set('referrer', filters.referrer);
      return (await api.get<StatsResponse>(`/stats?${params.toString()}`)).data;
    },
  });
}

export interface RealtimeResponse {
  active: number;
  perMinute: { bucket: string; views: number }[];
}

export function useRealtime(siteId: number) {
  return useQuery({
    queryKey: ['realtime', siteId],
    queryFn: async () => (await api.get<RealtimeResponse>(`/stats/realtime?siteId=${siteId}`)).data,
    refetchInterval: 15_000, // "en vivo": refresca cada 15s
  });
}
