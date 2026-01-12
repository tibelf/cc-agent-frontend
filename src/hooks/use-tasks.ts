import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import TaskService, { ListTasksParams, TaskActionRequest } from '@/services/tasks'
import { Task, CreateTaskRequest } from '@/types'

// Query Keys
export const TASK_QUERY_KEYS = {
  all: ['tasks'] as const,
  lists: () => [...TASK_QUERY_KEYS.all, 'list'] as const,
  list: (params: ListTasksParams) => [...TASK_QUERY_KEYS.lists(), params] as const,
  details: () => [...TASK_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TASK_QUERY_KEYS.details(), id] as const,
  logs: (id: string) => [...TASK_QUERY_KEYS.all, 'logs', id] as const,
  stats: () => [...TASK_QUERY_KEYS.all, 'stats'] as const,
}

// Hooks
export function useTasks(params: ListTasksParams = {}, enabled: boolean = true) {
  return useQuery({
    queryKey: TASK_QUERY_KEYS.list(params),
    queryFn: () => TaskService.listTasks(params),
    enabled,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  })
}

export function useTask(taskId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: TASK_QUERY_KEYS.detail(taskId),
    queryFn: () => TaskService.getTask(taskId),
    enabled: enabled && !!taskId,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // 30 seconds
  })
}

export function useTaskLogs(taskId: string, limit: number = 1000) {
  return useQuery({
    queryKey: TASK_QUERY_KEYS.logs(taskId),
    queryFn: () => TaskService.getTaskLogs(taskId, limit),
    enabled: !!taskId,
    refetchInterval: 5000, // 5 seconds for real-time logs
  })
}

export function useTaskStats() {
  return useQuery({
    queryKey: TASK_QUERY_KEYS.stats(),
    queryFn: TaskService.getTaskStats,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  })
}

// Mutations
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => TaskService.createTask(data),
    onSuccess: () => {
      // Invalidate tasks lists
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.stats() })
    },
  })
}

export function useTaskAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, request }: { taskId: string; request: TaskActionRequest }) =>
      TaskService.taskAction(taskId, request),
    onSuccess: (_, { taskId }) => {
      // Invalidate specific task and lists
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.stats() })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => TaskService.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      // Remove task from cache and invalidate lists
      queryClient.removeQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.stats() })
    },
  })
}

// Specialized hooks for dashboard
export function usePendingTasks(enabled: boolean = true) {
  return useQuery({
    queryKey: TASK_QUERY_KEYS.list({ state: 'pending', sort: 'created_at', order: 'desc' }),
    queryFn: () => TaskService.listTasks({ state: 'pending', sort: 'created_at', order: 'desc', limit: 10 }),
    enabled,
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

export function useProcessingTasks(enabled: boolean = true) {
  return useQuery({
    queryKey: TASK_QUERY_KEYS.list({ state: 'processing', sort: 'started_at', order: 'desc' }),
    queryFn: () => TaskService.listTasks({ state: 'processing', sort: 'started_at', order: 'desc', limit: 10 }),
    enabled,
    staleTime: 15000,
    refetchInterval: 30000,
  })
}

export function useRecentCompletedTasks(enabled: boolean = true) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  return useQuery({
    queryKey: TASK_QUERY_KEYS.list({ state: 'completed', completed_after: twentyFourHoursAgo }),
    queryFn: async () => {
      console.log('Fetching completed tasks with params:', {
        state: 'completed',
        completed_after: twentyFourHoursAgo,
        sort: 'completed_at',
        order: 'desc',
        limit: 20
      })
      try {
        const result = await TaskService.listTasks({
          state: 'completed',
          completed_after: twentyFourHoursAgo,
          sort: 'completed_at',
          order: 'desc',
          limit: 20
        })
        console.log('Completed tasks result:', result)
        return result
      } catch (error) {
        console.error('Error fetching completed tasks:', error)
        throw error
      }
    },
    enabled,
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 1 // Only retry once
  })
}

export function useRecentFailedTasks(enabled: boolean = true) {
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  
  return useQuery({
    queryKey: TASK_QUERY_KEYS.list({ state: 'failed', created_after: fiveDaysAgo }),
    queryFn: () => TaskService.listTasks({
      state: 'failed',
      created_after: fiveDaysAgo,
      sort: 'created_at',
      order: 'desc',
      limit: 20
    }),
    enabled,
    staleTime: 60000,
    refetchInterval: 300000, // 5 minutes
  })
}

// Optimistic updates helper
export function useOptimisticTaskUpdate() {
  const queryClient = useQueryClient()

  return {
    updateTask: (taskId: string, updates: Partial<Task>) => {
      queryClient.setQueryData(TASK_QUERY_KEYS.detail(taskId), (old: unknown) => {
        const data = old as { data?: Task } | undefined
        if (!data?.data) return old
        return {
          ...data,
          data: { ...data.data, ...updates }
        }
      })
    },

    updateTaskInList: (params: ListTasksParams, taskId: string, updates: Partial<Task>) => {
      queryClient.setQueryData(TASK_QUERY_KEYS.list(params), (old: unknown) => {
        const data = old as { data?: { items?: Task[] } } | undefined
        if (!data?.data?.items) return old
        return {
          ...data,
          data: {
            ...data.data,
            items: data.data.items.map((task: Task) =>
              task.id === taskId ? { ...task, ...updates } : task
            )
          }
        }
      })
    }
  }
}
