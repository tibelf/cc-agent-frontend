import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import SecurityService, { SecurityReport, SecurityLog, UserPermission, ApiKey } from '@/services/security'

// Query Keys
export const SECURITY_QUERY_KEYS = {
  all: ['security'] as const,
  report: () => [...SECURITY_QUERY_KEYS.all, 'report'] as const,
  logs: () => [...SECURITY_QUERY_KEYS.all, 'logs'] as const,
  logsList: (params: any) => [...SECURITY_QUERY_KEYS.logs(), params] as const,
  users: () => [...SECURITY_QUERY_KEYS.all, 'users'] as const,
  apiKeys: () => [...SECURITY_QUERY_KEYS.all, 'api-keys'] as const,
}

// Hooks for queries
export function useSecurityReport(enabled: boolean = true) {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.report(),
    queryFn: SecurityService.getSecurityReport,
    enabled,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
  })
}

export function useSecurityLogs(params?: {
  type?: string
  user?: string
  limit?: number
  offset?: number
}, enabled: boolean = true) {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.logsList(params),
    queryFn: () => SecurityService.getSecurityLogs(params),
    enabled,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  })
}

export function useSecurityUsers(enabled: boolean = true) {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.users(),
    queryFn: SecurityService.getUsers,
    enabled,
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // 10 minutes
  })
}

export function useApiKeys(enabled: boolean = true) {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.apiKeys(),
    queryFn: SecurityService.getApiKeys,
    enabled,
    staleTime: 300000, // 5 minutes
    refetchInterval: 600000, // 10 minutes
  })
}

// Mutations
export function useUnblockTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason: string }) =>
      SecurityService.unblockTask(taskId, reason),
    onSuccess: () => {
      // Invalidate security report after unblocking a task
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.report() })
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.logs() })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keyId: string) => SecurityService.revokeApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.apiKeys() })
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.logs() })
    },
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      name: string
      permissions: string[]
      expires_at?: string
    }) => SecurityService.createApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.apiKeys() })
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.logs() })
    },
  })
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      SecurityService.updateUserPermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.users() })
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.logs() })
    },
  })
}

export function useLockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => SecurityService.lockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.users() })
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.logs() })
    },
  })
}

export function useUnlockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => SecurityService.unlockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.users() })
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.logs() })
    },
  })
}