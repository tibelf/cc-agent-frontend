import { apiClient } from '@/lib/api-client'
import { Task, CreateTaskRequest, PaginatedResponse } from '@/types'

export interface ListTasksParams {
  state?: string
  priority?: string
  limit?: number
  offset?: number
  search?: string
  sort?: 'created_at' | 'started_at' | 'completed_at'
  order?: 'asc' | 'desc'
  created_after?: string
  created_before?: string
  completed_after?: string
  completed_before?: string
}

export interface TaskActionRequest {
  action: 'cancel' | 'retry' | 'pause' | 'resume'
  reason?: string
}

export class TaskService {
  /**
   * 获取任务列表
   */
  static async listTasks(params: ListTasksParams = {}) {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return apiClient.get<PaginatedResponse<Task>>(`/api/v1/tasks?${searchParams}`)
  }

  /**
   * 获取单个任务详情
   */
  static async getTask(taskId: string) {
    return apiClient.get<Task>(`/api/v1/tasks/${taskId}`)
  }

  /**
   * 创建新任务
   */
  static async createTask(request: CreateTaskRequest) {
    return apiClient.post<Task>('/api/v1/tasks', request)
  }

  /**
   * 执行任务操作
   */
  static async taskAction(taskId: string, request: TaskActionRequest) {
    return apiClient.post<{ success: boolean; message: string }>(
      `/api/v1/tasks/${taskId}/actions/${request.action}`,
      { reason: request.reason }
    )
  }

  /**
   * 删除任务
   */
  static async deleteTask(taskId: string) {
    return apiClient.delete<{ success: boolean }>(`/api/v1/tasks/${taskId}`)
  }

  /**
   * 获取任务日志
   */
  static async getTaskLogs(taskId: string, limit: number = 1000) {
    return apiClient.get<string[]>(`/api/v1/tasks/${taskId}/logs?limit=${limit}`)
  }

  /**
   * 获取任务统计信息
   */
  static async getTaskStats() {
    return apiClient.get<{
      total: number
      pending: number
      processing: number
      completed: number
      failed: number
      by_priority: Record<string, number>
      by_type: Record<string, number>
    }>('/api/v1/tasks/stats')
  }
}

export default TaskService