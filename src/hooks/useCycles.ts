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
