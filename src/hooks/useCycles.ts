import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Cycle {
  id: string;
  year: number;
  phase: string;
  windowOpen: string;
  windowClose: string;
  createdAt: string;
}

export function useActiveCycle() {
  return useQuery<Cycle>({
    queryKey: ['cycles', 'active'],
    queryFn: () => api.get('/api/cycles/active').then((r) => r.data),
    retry: false,
  });
}

export function useCycles() {
  return useQuery<Cycle[]>({
    queryKey: ['cycles'],
    queryFn: () => api.get('/api/cycles').then((r) => r.data),
  });
}

export function useAnalyticsOverview(cycleId?: string) {
  return useQuery({
    queryKey: ['analytics', 'overview', cycleId],
    queryFn: async () => {
      const url = cycleId ? `/api/analytics/overview?cycleId=${cycleId}` : '/api/analytics/overview';
      const { data } = await api.get(url);
      return data;
    },
  });
}

export function useAnalyticsQoQ(cycleId?: string, employeeId?: string) {
  return useQuery({
    queryKey: ['analytics', 'qoq', cycleId, employeeId],
    queryFn: async () => {
      const params: string[] = [];
      if (cycleId) params.push(`cycleId=${cycleId}`);
      if (employeeId) params.push(`employeeId=${employeeId}`);
      const url = '/api/analytics/qoq' + (params.length ? '?' + params.join('&') : '');
      const { data } = await api.get(url);
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useAnalyticsDistribution(cycleId?: string) {
  return useQuery({
    queryKey: ['analytics', 'distribution', cycleId],
    queryFn: async () => {
      const url = cycleId ? `/api/analytics/distribution?cycleId=${cycleId}` : '/api/analytics/distribution';
      const { data } = await api.get(url);
      return data;
    },
  });
}

export function useAnalyticsHeatmap(cycleId?: string) {
  return useQuery({
    queryKey: ['analytics', 'heatmap', cycleId],
    queryFn: async () => {
      const url = cycleId ? `/api/analytics/heatmap?cycleId=${cycleId}` : '/api/analytics/heatmap';
      const { data } = await api.get(url);
      return data;
    },
  });
}

export function useAnalyticsManagers(cycleId?: string) {
  return useQuery({
    queryKey: ['analytics', 'managers', cycleId],
    queryFn: async () => {
      const url = cycleId ? `/api/analytics/managers?cycleId=${cycleId}` : '/api/analytics/managers';
      const { data } = await api.get(url);
      return data;
    },
  });
}
