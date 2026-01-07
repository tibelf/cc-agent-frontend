import { apiClient } from '@/lib/api-client'

// 设置数据接口定义
export interface SystemSettings {
  name: string
  description: string
  timeout: number
  maxConcurrentTasks: number
}

export interface NotificationSettings {
  emailEnabled: boolean
  emailAddress: string
  webhookEnabled: boolean
  webhookUrl: string
  notificationLevel: string
}

export interface BackupSettings {
  autoBackup: boolean
  backupInterval: string
  retentionDays: number
  backupPath: string
}

export interface LogSettings {
  logLevel: string
  maxLogSize: number
  logRetentionDays: number
  enableFileLogging: boolean
}

export interface AllSettings {
  system: SystemSettings
  notifications: NotificationSettings
  backup: BackupSettings
  logging: LogSettings
}

// API 服务类
class SettingsService {
  private readonly baseUrl = '/api/settings'

  // 获取所有设置
  async getAllSettings(): Promise<AllSettings> {
    const response = await apiClient.get<AllSettings>(this.baseUrl)
    return response.data
  }

  // 获取系统设置
  async getSystemSettings(): Promise<SystemSettings> {
    const response = await apiClient.get<SystemSettings>(`${this.baseUrl}/system`)
    return response.data
  }

  // 更新系统设置
  async updateSystemSettings(settings: SystemSettings): Promise<SystemSettings> {
    const response = await apiClient.put<SystemSettings>(`${this.baseUrl}/system`, settings)
    return response.data
  }

  // 获取通知设置
  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get<NotificationSettings>(`${this.baseUrl}/notifications`)
    return response.data
  }

  // 更新通知设置
  async updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    const response = await apiClient.put<NotificationSettings>(`${this.baseUrl}/notifications`, settings)
    return response.data
  }

  // 测试邮件通知
  async testEmailNotification(emailAddress: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`${this.baseUrl}/notifications/test-email`, {
      emailAddress
    })
    return response.data
  }

  // 测试Webhook通知
  async testWebhookNotification(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`${this.baseUrl}/notifications/test-webhook`, {
      webhookUrl
    })
    return response.data
  }

  // 获取备份设置
  async getBackupSettings(): Promise<BackupSettings> {
    const response = await apiClient.get<BackupSettings>(`${this.baseUrl}/backup`)
    return response.data
  }

  // 更新备份设置
  async updateBackupSettings(settings: BackupSettings): Promise<BackupSettings> {
    const response = await apiClient.put<BackupSettings>(`${this.baseUrl}/backup`, settings)
    return response.data
  }

  // 手动触发备份
  async triggerManualBackup(): Promise<{ success: boolean; message: string; backupId?: string }> {
    const response = await apiClient.post<{ success: boolean; message: string; backupId?: string }>(`${this.baseUrl}/backup/trigger`)
    return response.data
  }

  // 获取备份历史
  async getBackupHistory(): Promise<Array<{
    id: string
    createdAt: string
    size: number
    status: 'success' | 'failed' | 'in_progress'
    path: string
  }>> {
    const response = await apiClient.get(`${this.baseUrl}/backup/history`)
    return response.data
  }

  // 获取日志设置
  async getLogSettings(): Promise<LogSettings> {
    const response = await apiClient.get<LogSettings>(`${this.baseUrl}/logging`)
    return response.data
  }

  // 更新日志设置
  async updateLogSettings(settings: LogSettings): Promise<LogSettings> {
    const response = await apiClient.put<LogSettings>(`${this.baseUrl}/logging`, settings)
    return response.data
  }

  // 保存所有设置
  async saveAllSettings(settings: AllSettings): Promise<AllSettings> {
    const response = await apiClient.put<AllSettings>(this.baseUrl, settings)
    return response.data
  }

  // 重置所有设置到默认值
  async resetToDefaults(): Promise<AllSettings> {
    const response = await apiClient.post<AllSettings>(`${this.baseUrl}/reset`)
    return response.data
  }

  // 导出设置
  async exportSettings(): Promise<Blob> {
    const response = await apiClient.get(`${this.baseUrl}/export`, {
      responseType: 'blob'
    })
    return response.data
  }

  // 导入设置
  async importSettings(file: File): Promise<{ success: boolean; message: string }> {
    const formData = new FormData()
    formData.append('settings', file)
    
    const response = await apiClient.post<{ success: boolean; message: string }>(`${this.baseUrl}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}

// 导出服务实例
export const settingsService = new SettingsService()

// 默认设置值
export const defaultSettings: AllSettings = {
  system: {
    name: 'CC-Agent System',
    description: 'Claude Cooperation Agent Management Platform',
    timeout: 300,
    maxConcurrentTasks: 10
  },
  notifications: {
    emailEnabled: false,
    emailAddress: '',
    webhookEnabled: false,
    webhookUrl: '',
    notificationLevel: 'error'
  },
  backup: {
    autoBackup: true,
    backupInterval: 'daily',
    retentionDays: 30,
    backupPath: '/data/backups'
  },
  logging: {
    logLevel: 'info',
    maxLogSize: 100,
    logRetentionDays: 7,
    enableFileLogging: true
  }
}