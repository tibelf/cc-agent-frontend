'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Bell, 
  Database, 
  FileText, 
  Save,
  RotateCcw,
  Download,
  Upload,
  TestTube,
  Loader2
} from 'lucide-react'
import { useSettings, useSettingsForm } from '@/hooks/use-settings'
import { useNotificationSettings } from '@/hooks/use-settings'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system')
  const {
    settings,
    isLoading,
    saveAll,
    reset,
    exportSettings,
    importSettings,
    isSaving,
    isResetting,
    isExporting,
    isImporting
  } = useSettings()
  
  const {
    testEmailNotification,
    testWebhookNotification,
    isTestingEmail,
    isTestingWebhook
  } = useNotificationSettings()
  
  const {
    formData,
    hasChanges,
    updateSystemSettings,
    updateNotificationSettings,
    updateBackupSettings,
    updateLogSettings,
    resetForm
  } = useSettingsForm(settings)

  const handleSaveSettings = async () => {
    try {
      await saveAll(formData)
      // 显示成功消息
    } catch (error) {
      console.error('Failed to save settings:', error)
      // 显示错误消息
    }
  }

  const handleResetSettings = async () => {
    try {
      await reset()
      resetForm()
      // 显示成功消息
    } catch (error) {
      console.error('Failed to reset settings:', error)
      // 显示错误消息
    }
  }
  
  const handleExportSettings = async () => {
    try {
      await exportSettings()
      // 显示成功消息
    } catch (error) {
      console.error('Failed to export settings:', error)
      // 显示错误消息
    }
  }
  
  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      await importSettings(file)
      // 显示成功消息
    } catch (error) {
      console.error('Failed to import settings:', error)
      // 显示错误消息
    }
  }
  
  const handleTestEmail = async () => {
    if (!formData.notifications.emailAddress) return
    
    try {
      const result = await testEmailNotification(formData.notifications.emailAddress)
      console.log('Email test result:', result)
      // 显示结果消息
    } catch (error) {
      console.error('Failed to test email:', error)
      // 显示错误消息
    }
  }
  
  const handleTestWebhook = async () => {
    if (!formData.notifications.webhookUrl) return
    
    try {
      const result = await testWebhookNotification(formData.notifications.webhookUrl)
      console.log('Webhook test result:', result)
      // 显示结果消息
    } catch (error) {
      console.error('Failed to test webhook:', error)
      // 显示错误消息
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载设置中...</span>
      </div>
    )
  }

  const tabs = [
    { id: 'system', name: '系统参数', icon: Settings },
    { id: 'notifications', name: '通知设置', icon: Bell },
    { id: 'backup', name: '备份配置', icon: Database },
    { id: 'logging', name: '日志配置', icon: FileText }
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">系统设置</h1>
          <p className="text-muted-foreground">
            配置系统参数、通知、备份和日志等设置
            {hasChanges && <span className="text-orange-600 ml-2">• 有未保存的更改</span>}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleExportSettings}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            导出设置
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
            <Button variant="outline" disabled={isImporting}>
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              导入设置
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={handleResetSettings}
            disabled={isResetting}
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            重置
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存设置
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* 系统参数配置 */}
        {activeTab === 'system' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>系统参数配置</span>
              </CardTitle>
              <CardDescription>
                配置系统的基本参数和运行设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    系统名称
                  </label>
                  <Input
                    value={formData.system.name}
                    onChange={(e) => updateSystemSettings({
                      name: e.target.value
                    })}
                    placeholder="输入系统名称"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    任务超时时间 (秒)
                  </label>
                  <Input
                    type="number"
                    value={formData.system.timeout}
                    onChange={(e) => updateSystemSettings({
                      timeout: parseInt(e.target.value) || 300
                    })}
                    placeholder="300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  系统描述
                </label>
                <Textarea
                  value={formData.system.description}
                  onChange={(e) => updateSystemSettings({
                    description: e.target.value
                  })}
                  placeholder="输入系统描述"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  最大并发任务数
                </label>
                <Input
                  type="number"
                  value={formData.system.maxConcurrentTasks}
                  onChange={(e) => updateSystemSettings({
                    maxConcurrentTasks: parseInt(e.target.value) || 10
                  })}
                  placeholder="10"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 通知设置 */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>通知设置</span>
                </CardTitle>
                <CardDescription>
                  配置系统通知方式和触发条件
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 邮件通知 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="emailEnabled"
                      checked={formData.notifications.emailEnabled}
                      onChange={(e) => updateNotificationSettings({
                        emailEnabled: e.target.checked
                      })}
                      className="rounded"
                    />
                    <label htmlFor="emailEnabled" className="text-sm font-medium">
                      启用邮件通知
                    </label>
                  </div>
                  {formData.notifications.emailEnabled && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        通知邮箱地址
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          type="email"
                          value={formData.notifications.emailAddress}
                          onChange={(e) => updateNotificationSettings({
                            emailAddress: e.target.value
                          })}
                          placeholder="admin@example.com"
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={handleTestEmail}
                          disabled={isTestingEmail || !formData.notifications.emailAddress}
                        >
                          {isTestingEmail ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4 mr-2" />
                          )}
                          测试
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Webhook通知 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="webhookEnabled"
                      checked={formData.notifications.webhookEnabled}
                      onChange={(e) => updateNotificationSettings({
                        webhookEnabled: e.target.checked
                      })}
                      className="rounded"
                    />
                    <label htmlFor="webhookEnabled" className="text-sm font-medium">
                      启用Webhook通知
                    </label>
                  </div>
                  {formData.notifications.webhookEnabled && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Webhook URL
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          value={formData.notifications.webhookUrl}
                          onChange={(e) => updateNotificationSettings({
                            webhookUrl: e.target.value
                          })}
                          placeholder="https://hooks.slack.com/..."
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={handleTestWebhook}
                          disabled={isTestingWebhook || !formData.notifications.webhookUrl}
                        >
                          {isTestingWebhook ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4 mr-2" />
                          )}
                          测试
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 通知级别 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    通知级别
                  </label>
                  <Select
                    value={formData.notifications.notificationLevel}
                    onValueChange={(value) => updateNotificationSettings({
                      notificationLevel: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">仅错误</SelectItem>
                      <SelectItem value="warning">警告及以上</SelectItem>
                      <SelectItem value="info">信息及以上</SelectItem>
                      <SelectItem value="debug">全部消息</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 备份配置 */}
        {activeTab === 'backup' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>备份配置</span>
              </CardTitle>
              <CardDescription>
                配置数据备份策略和存储设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoBackup"
                  checked={formData.backup.autoBackup}
                  onChange={(e) => updateBackupSettings({
                    autoBackup: e.target.checked
                  })}
                  className="rounded"
                />
                <label htmlFor="autoBackup" className="text-sm font-medium">
                  启用自动备份
                </label>
              </div>
              
              {formData.backup.autoBackup && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        备份频率
                      </label>
                      <Select
                        value={formData.backup.backupInterval}
                        onValueChange={(value) => updateBackupSettings({
                          backupInterval: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">每小时</SelectItem>
                          <SelectItem value="daily">每天</SelectItem>
                          <SelectItem value="weekly">每周</SelectItem>
                          <SelectItem value="monthly">每月</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        保留天数
                      </label>
                      <Input
                        type="number"
                        value={formData.backup.retentionDays}
                        onChange={(e) => updateBackupSettings({
                          retentionDays: parseInt(e.target.value) || 30
                        })}
                        placeholder="30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      备份存储路径
                    </label>
                    <Input
                      value={formData.backup.backupPath}
                      onChange={(e) => updateBackupSettings({
                        backupPath: e.target.value
                      })}
                      placeholder="/data/backups"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 日志配置 */}
        {activeTab === 'logging' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>日志配置</span>
              </CardTitle>
              <CardDescription>
                配置系统日志级别和存储策略
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    日志级别
                  </label>
                  <Select
                    value={formData.logging.logLevel}
                    onValueChange={(value) => updateLogSettings({
                      logLevel: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">调试 (DEBUG)</SelectItem>
                      <SelectItem value="info">信息 (INFO)</SelectItem>
                      <SelectItem value="warning">警告 (WARNING)</SelectItem>
                      <SelectItem value="error">错误 (ERROR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    日志保留天数
                  </label>
                  <Input
                    type="number"
                    value={formData.logging.logRetentionDays}
                    onChange={(e) => updateLogSettings({
                      logRetentionDays: parseInt(e.target.value) || 7
                    })}
                    placeholder="7"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  最大日志文件大小 (MB)
                </label>
                <Input
                  type="number"
                  value={formData.logging.maxLogSize}
                  onChange={(e) => updateLogSettings({
                    maxLogSize: parseInt(e.target.value) || 100
                  })}
                  placeholder="100"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableFileLogging"
                  checked={formData.logging.enableFileLogging}
                  onChange={(e) => updateLogSettings({
                    enableFileLogging: e.target.checked
                  })}
                  className="rounded"
                />
                <label htmlFor="enableFileLogging" className="text-sm font-medium">
                  启用文件日志记录
                </label>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}