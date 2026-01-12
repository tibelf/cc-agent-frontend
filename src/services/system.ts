import { apiClient } from '@/lib/api-client'
import { SystemStatus, SystemMetrics, WorkerStatus, Alert } from '@/types'

export class SystemService {
  /**
   * 获取系统状态
   */
  static async getSystemStatus() {
    return apiClient.get<SystemStatus>('/api/v1/system/status')
  }

  /**
   * 获取系统指标
   */
  static async getSystemMetrics(hours: number = 24) {
    return apiClient.get<SystemMetrics[]>(`/api/v1/system/metrics?hours=${hours}`)
  }

  /**
   * 获取Prometheus格式指标
   */
  static async getPrometheusMetrics() {
    const response = await apiClient.getRawClient().get('/api/v1/system/metrics/prometheus')
    return response.data
  }

  /**
   * 获取工作器列表
   */
  static async listWorkers() {
    return apiClient.get<WorkerStatus[]>('/api/v1/workers')
  }

  /**
   * 获取工作器详情
   */
  static async getWorker(workerId: string) {
    return apiClient.get<WorkerStatus>(`/api/v1/workers/${workerId}`)
  }

  /**
   * 重启工作器
   */
  static async restartWorker(workerId: string) {
    return apiClient.post<{ success: boolean; message: string }>(
      `/api/v1/workers/${workerId}/restart`
    )
  }

  /**
   * 获取告警列表
   */
  static async listAlerts(resolved: boolean = false) {
    return apiClient.get<Alert[]>(`/api/v1/alerts?resolved=${resolved}`)
  }

  /**
   * 解决告警
   */
  static async resolveAlert(alertId: string, resolution?: string) {
    return apiClient.post<{ success: boolean }>(
      `/api/v1/alerts/${alertId}/resolve`,
      { resolution }
    )
  }

  /**
   * 清理系统数据
   */
  static async cleanupSystem(days: number = 7) {
    return apiClient.post<{ 
      success: boolean 
      cleaned_tasks: number
      cleaned_logs: number
      freed_space_mb: number
    }>('/api/v1/system/cleanup', { days })
  }

  /**
   * 获取系统配置
   */
  static async getSystemConfig() {
    return apiClient.get<Record<string, unknown>>('/api/v1/system/config')
  }

  /**
   * 更新系统配置
   */
  static async updateSystemConfig(config: Record<string, unknown>) {
    return apiClient.put<{ success: boolean }>('/api/v1/system/config', config)
  }

  /**
   * 获取系统健康检查
   */
  static async healthCheck() {
    return apiClient.get<{
      status: 'healthy' | 'degraded' | 'unhealthy'
      checks: Array<{
        name: string
        status: 'pass' | 'fail' | 'warn'
        message?: string
        duration_ms?: number
      }>
      timestamp: string
    }>('/api/v1/health')
  }
}

export default SystemService