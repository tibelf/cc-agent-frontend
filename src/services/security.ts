import { apiClient } from '@/lib/api-client'
import { ApiResponse } from '@/types'

export interface SecurityReport {
  security_status: 'healthy' | 'warning' | 'critical'
  blocked_tasks_count: number
  blocked_task_ids: string[]
  recent_violations: Record<string, number>
}

export interface SecurityLog {
  id: string
  type: 'login' | 'logout' | 'permission_change' | 'api_access' | 'failed_login' | 'system_change'
  user: string
  action: string
  ip_address: string
  user_agent: string
  timestamp: string
  success: boolean
  details?: any
}

export interface UserPermission {
  id: string
  username: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
  permissions: string[]
  last_login: string
  status: 'active' | 'inactive' | 'locked'
  created_at: string
}

export interface ApiKey {
  id: string
  name: string
  key_preview: string
  permissions: string[]
  created_at: string
  last_used: string
  expires_at?: string
  status: 'active' | 'revoked'
}

export default class SecurityService {
  static async getSecurityReport(): Promise<ApiResponse<SecurityReport>> {
    return apiClient.get('/api/v1/security/report')
  }

  static async getSecurityLogs(params?: {
    type?: string
    user?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{ items: SecurityLog[], total: number }>> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return apiClient.get(`/api/v1/security/logs?${searchParams}`)
  }

  static async getUsers(): Promise<ApiResponse<UserPermission[]>> {
    return apiClient.get('/api/v1/security/users')
  }

  static async getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    return apiClient.get('/api/v1/security/api-keys')
  }

  static async unblockTask(taskId: string, reason: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post(`/api/v1/security/tasks/${taskId}/unblock`, { reason })
  }

  static async revokeApiKey(keyId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete(`/api/v1/security/api-keys/${keyId}`)
  }

  static async createApiKey(data: {
    name: string
    permissions: string[]
    expires_at?: string
  }): Promise<ApiResponse<ApiKey>> {
    return apiClient.post('/api/v1/security/api-keys', data)
  }

  static async updateUserPermissions(userId: string, permissions: string[]): Promise<ApiResponse<UserPermission>> {
    return apiClient.put(`/api/v1/security/users/${userId}/permissions`, { permissions })
  }

  static async lockUser(userId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post(`/api/v1/security/users/${userId}/lock`)
  }

  static async unlockUser(userId: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post(`/api/v1/security/users/${userId}/unlock`)
  }
}
