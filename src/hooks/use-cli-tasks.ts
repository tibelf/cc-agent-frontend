import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CLIService } from '@/services/cli-service'

interface TaskListParams {
  state?: string;
  priority?: string;
  enabled?: boolean;
}

// Query Keys
export const CLI_QUERY_KEYS = {
  all: ['cli'] as const,
  tasks: () => [...CLI_QUERY_KEYS.all, 'tasks'] as const,
  taskList: (params?: TaskListParams) => [...CLI_QUERY_KEYS.tasks(), 'list', params] as const,
  task: (id: string) => [...CLI_QUERY_KEYS.tasks(), 'detail', id] as const,
  taskLogs: (id: string) => [...CLI_QUERY_KEYS.tasks(), 'logs', id] as const,
  scheduledTasks: () => [...CLI_QUERY_KEYS.all, 'scheduled-tasks'] as const,
  scheduledTaskList: () => [...CLI_QUERY_KEYS.scheduledTasks(), 'list'] as const,
  workers: () => [...CLI_QUERY_KEYS.all, 'workers'] as const,
  workerList: () => [...CLI_QUERY_KEYS.workers(), 'list'] as const,
  worker: (id: string) => [...CLI_QUERY_KEYS.workers(), 'detail', id] as const,
  systemStatus: () => [...CLI_QUERY_KEYS.all, 'system', 'status'] as const,
  taskStats: () => [...CLI_QUERY_KEYS.all, 'stats'] as const,
}

// Task Hooks
export function useCLITasks(params?: {
  state?: string
  priority?: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: CLI_QUERY_KEYS.taskList(params),
    queryFn: () => CLIService.listTasks({
      state: params?.state,
      priority: params?.priority,
      format: 'json'
    }),
    enabled: params?.enabled !== false,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // 30 seconds
    retry: (failureCount, error) => {
      console.error('获取任务列表失败:', error)
      return failureCount < 2
    }
  })
}

export function useCLITask(taskId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: CLI_QUERY_KEYS.task(taskId),
    queryFn: () => CLIService.getTask(taskId),
    enabled: enabled && !!taskId,
    staleTime: 5000, // 5 seconds
    refetchInterval: 15000, // 15 seconds
    retry: 1
  })
}

export function useCLITaskLogs(taskId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: CLI_QUERY_KEYS.taskLogs(taskId),
    queryFn: () => CLIService.getTaskLogs(taskId),
    enabled: enabled && !!taskId,
    staleTime: 2000, // 2 seconds
    refetchInterval: 5000, // 5 seconds for real-time feel
    retry: 1
  })
}

export function useCLITaskStats() {
  return useQuery({
    queryKey: CLI_QUERY_KEYS.taskStats(),
    queryFn: CLIService.getTaskStats,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // 30 seconds
    retry: 2
  })
}

// Worker Hooks
export function useCLIWorkers(enabled: boolean = true) {
  return useQuery({
    queryKey: CLI_QUERY_KEYS.workerList(),
    queryFn: CLIService.listWorkers,
    enabled,
    staleTime: 10000, // 10 seconds
    refetchInterval: 20000, // 20 seconds
    retry: 2
  })
}

export function useCLIWorker(workerId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: CLI_QUERY_KEYS.worker(workerId),
    queryFn: () => CLIService.getWorker(workerId),
    enabled: enabled && !!workerId,
    staleTime: 5000, // 5 seconds
    refetchInterval: 15000, // 15 seconds
    retry: 1
  })
}

// System Hooks
export function useCLISystemStatus(enabled: boolean = true) {
  return useQuery({
    queryKey: CLI_QUERY_KEYS.systemStatus(),
    queryFn: CLIService.getSystemStatus,
    enabled,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // 30 seconds
    retry: 2
  })
}

// Mutation Hooks
export function useCreateCLITask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      name: string
      description: string
      type?: 'lightweight' | 'medium_context' | 'heavy_context'
      priority?: 'low' | 'normal' | 'high' | 'urgent'
    }) => CLIService.createTask(params),
    onSuccess: () => {
      // Invalidate tasks lists and stats
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.tasks() })
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.taskStats() })
    },
    onError: (error) => {
      console.error('创建任务失败:', error)
    }
  })
}

export function useCLITaskAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, action, force }: { 
      taskId: string; 
      action: 'cancel' | 'retry' | 'pause' | 'resume';
      force?: boolean;
    }) => CLIService.taskAction(taskId, action, { force }),
    onSuccess: (_, { taskId }) => {
      // Invalidate specific task and related queries
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.task(taskId) })
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.tasks() })
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.taskStats() })
    },
    onError: (error) => {
      console.error('任务操作失败:', error)
    }
  })
}

export function useRestartCLIWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workerId: string) => CLIService.restartWorker(workerId),
    onSuccess: (_, workerId) => {
      // Invalidate worker queries
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.worker(workerId) })
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.workers() })
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.systemStatus() })
    },
    onError: (error) => {
      console.error('重启工作器失败:', error)
    }
  })
}

// Scheduled Tasks Hooks
export function useCLIScheduledTasks(enabled: boolean = true) {
  return useQuery({
    queryKey: CLI_QUERY_KEYS.scheduledTaskList(),
    queryFn: CLIService.listScheduledTasks,
    enabled,
    staleTime: 30000, // 30 seconds - scheduled tasks don't change frequently
    refetchInterval: 60000, // 1 minute
    retry: 2
  })
}

export function useAddCLIScheduledTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      name: string
      description: string
      cron: string
      type?: 'lightweight' | 'medium_context' | 'heavy_context'
      workingDir?: string
    }) => CLIService.addScheduledTask(params),
    onSuccess: () => {
      // Invalidate scheduled tasks list
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.scheduledTasks() })
    },
    onError: (error) => {
      console.error('创建定时任务失败:', error)
    }
  })
}

export function useRemoveCLIScheduledTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => CLIService.removeScheduledTask(taskId),
    onSuccess: () => {
      // Invalidate scheduled tasks list
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.scheduledTasks() })
    },
    onError: (error) => {
      console.error('删除定时任务失败:', error)
    }
  })
}

export function useToggleCLIScheduledTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, enable }: { taskId: string; enable: boolean }) => 
      CLIService.toggleScheduledTask(taskId, enable),
    onSuccess: () => {
      // Invalidate scheduled tasks list
      queryClient.invalidateQueries({ queryKey: CLI_QUERY_KEYS.scheduledTasks() })
    },
    onError: (error) => {
      console.error('切换定时任务状态失败:', error)
    }
  })
}

// Utility hook for checking CLI availability
export function useCLIAvailability() {
  return useQuery({
    queryKey: [...CLI_QUERY_KEYS.all, 'availability'],
    queryFn: CLIService.checkAvailability,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
    retry: 1
  })
}
