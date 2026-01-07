import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  settingsService, 
  AllSettings, 
  SystemSettings, 
  NotificationSettings, 
  BackupSettings, 
  LogSettings,
  defaultSettings 
} from '@/services/settings'

// 查询键
export const settingsKeys = {
  all: ['settings'] as const,
  system: () => [...settingsKeys.all, 'system'] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
  backup: () => [...settingsKeys.all, 'backup'] as const,
  logging: () => [...settingsKeys.all, 'logging'] as const,
}

// 主设置Hook
export function useSettings() {
  const queryClient = useQueryClient()
  
  // 获取所有设置
  const {
    data: settings = defaultSettings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => settingsService.getAllSettings(),
    staleTime: 1000 * 60 * 5, // 5分钟内不重新获取
  })

  // 保存所有设置
  const saveAllMutation = useMutation({
    mutationFn: (settings: AllSettings) => settingsService.saveAllSettings(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.all, data)
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })

  // 重置设置
  const resetMutation = useMutation({
    mutationFn: () => settingsService.resetToDefaults(),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.all, data)
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })

  // 导出设置
  const exportMutation = useMutation({
    mutationFn: () => settingsService.exportSettings(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cc-agent-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })

  // 导入设置
  const importMutation = useMutation({
    mutationFn: (file: File) => settingsService.importSettings(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })

  return {
    settings,
    isLoading,
    error,
    refetch,
    saveAll: saveAllMutation.mutateAsync,
    reset: resetMutation.mutateAsync,
    exportSettings: exportMutation.mutateAsync,
    importSettings: importMutation.mutateAsync,
    isSaving: saveAllMutation.isPending,
    isResetting: resetMutation.isPending,
    isExporting: exportMutation.isPending,
    isImporting: importMutation.isPending,
  }
}

// 系统设置Hook
export function useSystemSettings() {
  const queryClient = useQueryClient()
  
  const {
    data: systemSettings = defaultSettings.system,
    isLoading,
    error
  } = useQuery({
    queryKey: settingsKeys.system(),
    queryFn: () => settingsService.getSystemSettings(),
  })

  const updateMutation = useMutation({
    mutationFn: (settings: SystemSettings) => settingsService.updateSystemSettings(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.system(), data)
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })

  return {
    systemSettings,
    isLoading,
    error,
    updateSystemSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

// 通知设置Hook
export function useNotificationSettings() {
  const queryClient = useQueryClient()
  
  const {
    data: notificationSettings = defaultSettings.notifications,
    isLoading,
    error
  } = useQuery({
    queryKey: settingsKeys.notifications(),
    queryFn: () => settingsService.getNotificationSettings(),
  })

  const updateMutation = useMutation({
    mutationFn: (settings: NotificationSettings) => settingsService.updateNotificationSettings(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.notifications(), data)
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })

  const testEmailMutation = useMutation({
    mutationFn: (emailAddress: string) => settingsService.testEmailNotification(emailAddress),
  })

  const testWebhookMutation = useMutation({
    mutationFn: (webhookUrl: string) => settingsService.testWebhookNotification(webhookUrl),
  })

  return {
    notificationSettings,
    isLoading,
    error,
    updateNotificationSettings: updateMutation.mutateAsync,
    testEmailNotification: testEmailMutation.mutateAsync,
    testWebhookNotification: testWebhookMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isTestingEmail: testEmailMutation.isPending,
    isTestingWebhook: testWebhookMutation.isPending,
  }
}

// 备份设置Hook
export function useBackupSettings() {
  const queryClient = useQueryClient()
  
  const {
    data: backupSettings = defaultSettings.backup,
    isLoading,
    error
  } = useQuery({
    queryKey: settingsKeys.backup(),
    queryFn: () => settingsService.getBackupSettings(),
  })

  const updateMutation = useMutation({
    mutationFn: (settings: BackupSettings) => settingsService.updateBackupSettings(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.backup(), data)
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })

  const triggerBackupMutation = useMutation({
    mutationFn: () => settingsService.triggerManualBackup(),
  })

  const { data: backupHistory = [] } = useQuery({
    queryKey: [...settingsKeys.backup(), 'history'],
    queryFn: () => settingsService.getBackupHistory(),
  })

  return {
    backupSettings,
    backupHistory,
    isLoading,
    error,
    updateBackupSettings: updateMutation.mutateAsync,
    triggerManualBackup: triggerBackupMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isTriggeringBackup: triggerBackupMutation.isPending,
  }
}

// 日志设置Hook
export function useLogSettings() {
  const queryClient = useQueryClient()
  
  const {
    data: logSettings = defaultSettings.logging,
    isLoading,
    error
  } = useQuery({
    queryKey: settingsKeys.logging(),
    queryFn: () => settingsService.getLogSettings(),
  })

  const updateMutation = useMutation({
    mutationFn: (settings: LogSettings) => settingsService.updateLogSettings(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.logging(), data)
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
  })

  return {
    logSettings,
    isLoading,
    error,
    updateLogSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}

// 设置表单Hook - 用于管理本地表单状态
export function useSettingsForm(initialSettings?: AllSettings) {
  const [formData, setFormData] = useState<AllSettings>(initialSettings || defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (initialSettings) {
      setFormData(initialSettings)
      setHasChanges(false)
    }
  }, [initialSettings])

  const updateSystemSettings = (settings: Partial<SystemSettings>) => {
    setFormData(prev => ({
      ...prev,
      system: { ...prev.system, ...settings }
    }))
    setHasChanges(true)
  }

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...settings }
    }))
    setHasChanges(true)
  }

  const updateBackupSettings = (settings: Partial<BackupSettings>) => {
    setFormData(prev => ({
      ...prev,
      backup: { ...prev.backup, ...settings }
    }))
    setHasChanges(true)
  }

  const updateLogSettings = (settings: Partial<LogSettings>) => {
    setFormData(prev => ({
      ...prev,
      logging: { ...prev.logging, ...settings }
    }))
    setHasChanges(true)
  }

  const resetForm = () => {
    if (initialSettings) {
      setFormData(initialSettings)
    } else {
      setFormData(defaultSettings)
    }
    setHasChanges(false)
  }

  return {
    formData,
    hasChanges,
    updateSystemSettings,
    updateNotificationSettings,
    updateBackupSettings,
    updateLogSettings,
    resetForm,
    setHasChanges,
  }
}