import { alertsAPI, communityAPI, evacuationAPI, reportsAPI, resourcesAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

// Alerts Hooks
export const useAlerts = (params?: { severity?: string; type?: string; limit?: number; includeDisabled?: string }) => {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertsAPI.getAll(params),
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
    gcTime: 60000, // Cache for 1 minute
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch on component mount
  });
};

export const useNearbyAlerts = (longitude?: number, latitude?: number, radius?: number) => {
  return useQuery({
    queryKey: ['alerts', 'nearby', longitude, latitude, radius],
    queryFn: () => alertsAPI.getNearby(longitude!, latitude!, radius),
    enabled: !!longitude && !!latitude,
  });
};

export const useAlert = (id: string) => {
  return useQuery({
    queryKey: ['alerts', id],
    queryFn: () => alertsAPI.getById(id),
    enabled: !!id,
  });
};

// Reports Hooks
export const useReports = (params?: { status?: string; type?: string; severity?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => reportsAPI.getAll(params),
  });
};

export const useNearbyReports = (longitude?: number, latitude?: number, radius?: number) => {
  return useQuery({
    queryKey: ['reports', 'nearby', longitude, latitude, radius],
    queryFn: () => reportsAPI.getNearby(longitude!, latitude!, radius),
    enabled: !!longitude && !!latitude,
  });
};

export const useMyReports = () => {
  return useQuery({
    queryKey: ['reports', 'my-reports'],
    queryFn: () => reportsAPI.getMyReports(),
  });
};

// Resources Hooks
export const useResources = (params?: { type?: string; availability?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['resources', params],
    queryFn: () => resourcesAPI.getAll(params),
  });
};

export const useNearbyResources = (
  longitude?: number,
  latitude?: number,
  radius?: number,
  type?: string
) => {
  return useQuery({
    queryKey: ['resources', 'nearby', longitude, latitude, radius, type],
    queryFn: () => resourcesAPI.getNearby(longitude!, latitude!, radius, type),
    enabled: !!longitude && !!latitude,
  });
};

export const useResource = (id: string) => {
  return useQuery({
    queryKey: ['resources', id],
    queryFn: () => resourcesAPI.getById(id),
    enabled: !!id,
  });
};

// Evacuation Hooks
export const useEvacuationRoutes = (params?: { status?: string; active?: boolean }) => {
  return useQuery({
    queryKey: ['evacuation', params],
    queryFn: () => evacuationAPI.getAll(params),
  });
};

export const useEvacuationRoutesFrom = (longitude?: number, latitude?: number, radius?: number) => {
  return useQuery({
    queryKey: ['evacuation', 'from', longitude, latitude, radius],
    queryFn: () => evacuationAPI.getFrom(longitude!, latitude!, radius),
    enabled: !!longitude && !!latitude,
  });
};

export const useEvacuationRoute = (id: string) => {
  return useQuery({
    queryKey: ['evacuation', id],
    queryFn: () => evacuationAPI.getById(id),
    enabled: !!id,
  });
};

// Community Hooks
export const useCommunityPosts = (params?: { category?: string; status?: string; limit?: number }) => {
  return useQuery({
    queryKey: ['community', params],
    queryFn: () => communityAPI.getAll(params),
  });
};

export const useNearbyCommunityPosts = (longitude?: number, latitude?: number, radius?: number) => {
  return useQuery({
    queryKey: ['community', 'nearby', longitude, latitude, radius],
    queryFn: () => communityAPI.getNearby(longitude!, latitude!, radius),
    enabled: !!longitude && !!latitude,
  });
};
