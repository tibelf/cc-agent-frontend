import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import SystemService from '@/services/system'

// Query Keys
export const SYSTEM_QUERY_KEYS = {
  all: ['system'] as const,
  status: () => [...SYSTEM_QUERY_KEYS.all, 'status'] as const,
  metrics: () => [...SYSTEM_QUERY_KEYS.all, 'metrics'] as const,
  metricsWithHours: (hours: number) => [...SYSTEM_QUERY_KEYS.metrics(), hours] as const,
  workers: () => [...SYSTEM_QUERY_KEYS.all, 'workers'] as const,
  worker: (id: string) => [...SYSTEM_QUERY_KEYS.workers(), id] as const,
  alerts: () => [...SYSTEM_QUERY_KEYS.all, 'alerts'] as const,
  config: () => [...SYSTEM_QUERY_KEYS.all, 'config'] as const,
  health: () => [...SYSTEM_QUERY_KEYS.all, 'health'] as const,
}

// Hooks
export function useSystemStatus() {
  return useQuery({
    queryKey: SYSTEM_QUERY_KEYS.status(),
    queryFn: SystemService.getSystemStatus,
    refetchInterval: 30000, // 30 seconds
    staleTime: 20000, // 20 seconds
  })
}

export function useSystemMetrics(hours: number = 24) {
  return useQuery({
    queryKey: SYSTEM_QUERY_KEYS.metricsWithHours(hours),
    queryFn: () => SystemService.getSystemMetrics(hours),
    refetchInterval: 60000, // 1 minute
    staleTime: 30000, // 30 seconds
  })
}

export function useWorkers() {
  return useQuery({
    queryKey: SYSTEM_QUERY_KEYS.workers(),
    queryFn: SystemService.listWorkers,
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000, // 15 seconds
  })
}

export function useWorker(workerId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: SYSTEM_QUERY_KEYS.worker(workerId),
    queryFn: () => SystemService.getWorker(workerId),
    enabled: enabled && !!workerId,
    refetchInterval: 15000, // 15 seconds
    staleTime: 10000, // 10 seconds
  })
}

export function useAlerts(resolved: boolean = false) {
  return useQuery({
    queryKey: [...SYSTEM_QUERY_KEYS.alerts(), { resolved }],
    queryFn: () => SystemService.listAlerts(resolved),
    refetchInterval: 60000, // 1 minute
    staleTime: 30000, // 30 seconds
  })
}

export function useSystemConfig() {
  return useQuery({
    queryKey: SYSTEM_QUERY_KEYS.config(),
    queryFn: SystemService.getSystemConfig,
    staleTime: 300000, // 5 minutes
  })
}

export function useHealthCheck() {
  return useQuery({
    queryKey: SYSTEM_QUERY_KEYS.health(),
    queryFn: SystemService.healthCheck,
    refetchInterval: 30000, // 30 seconds
    staleTime: 20000, // 20 seconds
  })
}

// Mutations
export function useRestartWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workerId: string) => SystemService.restartWorker(workerId),
    onSuccess: (_, workerId) => {
      // Invalidate worker data
      queryClient.invalidateQueries({ queryKey: SYSTEM_QUERY_KEYS.worker(workerId) })
      queryClient.invalidateQueries({ queryKey: SYSTEM_QUERY_KEYS.workers() })
      queryClient.invalidateQueries({ queryKey: SYSTEM_QUERY_KEYS.status() })
    },
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ alertId, resolution }: { alertId: string; resolution?: string }) =>
      SystemService.resolveAlert(alertId, resolution),
    onSuccess: () => {
      // Invalidate alerts data
      queryClient.invalidateQueries({ queryKey: SYSTEM_QUERY_KEYS.alerts() })
      queryClient.invalidateQueries({ queryKey: SYSTEM_QUERY_KEYS.status() })
    },
  })
}

export function useCleanupSystem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (days: number = 7) => SystemService.cleanupSystem(days),
    onSuccess: () => {
      // Invalidate system status and metrics
      queryClient.invalidateQueries({ queryKey: SYSTEM_QUERY_KEYS.status() })
      queryClient.invalidateQueries({ queryKey: SYSTEM_QUERY_KEYS.metrics() })
    },
  })
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: Record<string, any>) => SystemService.updateSystemConfig(config),
    onSuccess: () => {
      // Invalidate config data
      queryClient.invalidateQueries({ queryKey: SYSTEM_QUERY_KEYS.config() })
      queryClient.invalidateQueries({ queryKey: SYSTEM_QUERY_KEYS.status() })
    },
  })
}