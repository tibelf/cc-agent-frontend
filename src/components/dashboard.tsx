'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Plus,
  RefreshCw,
  Power,
  Calendar
} from 'lucide-react'
import { 
  useCLITasks,
  useCLISystemStatus,
  useCLIScheduledTasks
} from '@/hooks/use-cli-tasks'
import { formatBeijingDateTimeSimple, formatDuration, getPriorityColor } from '@/lib/utils'
import Link from 'next/link'
import { toast } from '@/components/ui/sonner'

// 模拟系统状态数据 - 在实际API完成后会被替换
const mockSystemStatus = {
  status: 'healthy' as const,
  active_workers: 2,
  pending_tasks: 5,
  processing_tasks: 3,
  disk_space_gb: 45.2,
  memory_usage_percent: 68.5,
  uptime_seconds: 86400,
  last_updated: new Date().toISOString()
}

// 模拟已完成任务数据
const mockCompletedTasks = [
  {
    id: 'task_comp_001',
    name: '代码重构任务',
    task_state: 'completed',
    priority: 'high',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    completed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    assigned_worker: 'worker_01'
  },
  {
    id: 'task_comp_002',
    name: '数据库优化',
    task_state: 'completed',
    priority: 'normal',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    completed_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    assigned_worker: 'worker_02'
  },
  {
    id: 'task_comp_003',
    name: 'API接口测试',
    task_state: 'completed',
    priority: 'urgent',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    completed_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    assigned_worker: 'worker_01'
  }
]

// 模拟失败任务数据
const mockFailedTasks = [
  {
    id: 'task_fail_001',
    name: '部署生产环境',
    task_state: 'failed',
    priority: 'urgent',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    last_error: 'Connection timeout: Unable to connect to production server'
  },
  {
    id: 'task_fail_002',
    name: '数据备份任务',
    task_state: 'failed',
    priority: 'high',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    last_error: 'Disk space insufficient'
  }
]

export default function Dashboard() {
  // 状态管理
  const [isTogglingService, setIsTogglingService] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // 获取系统状态
  const { data: systemStatusData, isLoading: systemLoading, refetch: refetchSystem } = useCLISystemStatus()
  const systemStatus = systemStatusData || mockSystemStatus
  
  // 服务控制函数
  const handleServiceToggle = async () => {
    if (isTogglingService) return
    
    setIsTogglingService(true)
    try {
      const action = systemStatus.status === 'healthy' ? 'stop' : 'start'
      const response = await fetch('/api/service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // 延迟一点再刷新，给服务时间启动/停止
        setTimeout(() => {
          refetchSystem?.()
        }, 1000)
      } else {
        console.error('服务操作失败:', result.message)
        alert(`操作失败: ${result.message}`)
      }
    } catch (error) {
      console.error('服务控制错误:', error)
      alert('服务操作失败，请稍后重试')
    } finally {
      setIsTogglingService(false)
    }
  }
  
  // 获取不同状态的任务列表
  const { data: pendingTasks = [], isLoading: pendingLoading, error: pendingError, refetch: refetchPending } = useCLITasks({ state: 'pending' })
  const { data: processingTasks = [], isLoading: processingLoading, error: processingError, refetch: refetchProcessing } = useCLITasks({ state: 'processing' })
  const { data: allCompletedTasks = [], isLoading: completedLoading, error: completedError, refetch: refetchCompleted } = useCLITasks({ state: 'completed' })
  const { data: allFailedTasks = [], isLoading: failedLoading, error: failedError, refetch: refetchFailed } = useCLITasks({ state: 'failed' })
  
  // 获取定时任务列表
  const { data: scheduledTasks = [], isLoading: scheduledLoading, error: scheduledError, refetch: refetchScheduled } = useCLIScheduledTasks()
  
  // 过滤已完成任务（24小时内）和失败任务（5天内）
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  
  const completedTasks = (allCompletedTasks || mockCompletedTasks).filter((task: { completed_at?: string; created_at: string }) => {
    const completedAt = task.completed_at ? new Date(task.completed_at) : new Date(task.created_at)
    return completedAt >= twentyFourHoursAgo
  })
  
  const failedTasks = (allFailedTasks || mockFailedTasks).filter((task: { created_at: string }) => {
    const createdAt = new Date(task.created_at)
    return createdAt >= fiveDaysAgo
  })
  
  // 调试信息
  console.log('Dashboard data:', {
    pendingTasks: pendingTasks?.length,
    pendingLoading,
    pendingError: pendingError?.message,
    processingTasks: processingTasks?.length,
    processingLoading,
    processingError: processingError?.message,
    allCompletedTasks: allCompletedTasks?.length,
    completedLoading,
    completedError: completedError?.message,
    completedTasks: completedTasks.length,
    allFailedTasks: allFailedTasks?.length,
    failedLoading,
    failedError: failedError?.message,
    failedTasks: failedTasks.length,
    scheduledTasks: scheduledTasks?.length,
    scheduledLoading,
    scheduledError: scheduledError?.message
  })
  
  // 全局刷新函数
  const handleRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await Promise.all([
        refetchSystem?.(),
        refetchPending(),
        refetchProcessing(),
        refetchCompleted(),
        refetchFailed(),
        refetchScheduled()
      ])
      
      toast.success('数据刷新成功')
    } catch (error) {
      console.error('刷新数据失败:', error)
      toast.error('数据刷新失败')
    } finally {
      setIsRefreshing(false)
    }
  }

  const isAnyLoading = isRefreshing || systemLoading || pendingLoading || processingLoading || completedLoading || failedLoading || scheduledLoading

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">系统概览</h1>
          <p className="text-muted-foreground">CC-Agent 自动化任务执行系统</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isAnyLoading}
            className={isRefreshing ? 'opacity-75' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnyLoading ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中...' : '刷新数据'}
          </Button>
          <Link href="/tasks/create">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              创建任务
            </Button>
          </Link>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Claude 服务</CardTitle>
            <Power className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Switch
                    checked={systemStatus.status === 'healthy'}
                    disabled={isTogglingService || systemLoading}
                    onCheckedChange={handleServiceToggle}
                    className={systemStatus.status === 'healthy'
                      ? 'data-[state=checked]:bg-success'
                      : 'data-[state=unchecked]:bg-destructive/30'
                    }
                  />
                  {isTogglingService && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <div className={`text-sm font-medium ${
                    systemStatus.status === 'healthy'
                      ? 'text-success'
                      : 'text-destructive'
                  }`}>
                    {isTogglingService 
                      ? (systemStatus.status === 'healthy' ? '正在停止...' : '正在启动...')
                      : (systemStatus.status === 'healthy' ? '运行中' : '已停止')
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {systemStatus.status === 'healthy' 
                      ? `运行时间: ${formatDuration(systemStatus.uptime_seconds)}`
                      : '点击开关启动服务'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃工作器</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStatus.active_workers}</div>
            <p className="text-xs text-muted-foreground">
              CPU: 45.2% | 内存: {systemStatus.memory_usage_percent}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">任务队列</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              处理中: {processingTasks.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 待处理任务 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-warning" />
              <span>待处理任务</span>
              <Badge variant="outline">{pendingTasks.length}</Badge>
            </CardTitle>
            <CardDescription>当前等待执行的任务</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">加载中...</span>
                </div>
              ) : pendingTasks.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-8">
                  暂无待处理任务
                </div>
              ) : (
                pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link href={`/tasks/${task.id}`}>
                          <span className="font-medium hover:text-primary cursor-pointer truncate">
                            {task.name}
                          </span>
                        </Link>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span className="truncate">{task.id}</span>
                        <span>•</span>
                        <span>{formatBeijingDateTimeSimple(task.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority === 'urgent' && '紧急'}
                        {task.priority === 'high' && '高'}
                        {task.priority === 'normal' && '普通'}
                        {task.priority === 'low' && '低'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            {pendingTasks.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/tasks?state=pending">
                  <Button variant="outline" size="sm">
                    查看全部
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 定时任务 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-info" />
              <span>定时任务</span>
              <Badge variant="outline">{scheduledTasks.length}</Badge>
            </CardTitle>
            <CardDescription>当前的定时任务设置</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {scheduledLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">加载中...</span>
                </div>
              ) : scheduledTasks.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-8">
                  暂无定时任务
                </div>
              ) : (
                scheduledTasks.map((task) => (
                  <div key={task.task_id} className="flex items-center justify-between p-3 rounded-lg border border-info/30 bg-info/10 hover:border-info/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium truncate">
                          {task.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span className="truncate" title={task.cron_expression}>{task.cron_expression}</span>
                        <span>•</span>
                        <span>{formatBeijingDateTimeSimple(task.created_at)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate" title={task.description}>
                        {task.description}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge className={task.enabled
                        ? "bg-success/20 text-success-foreground"
                        : "bg-muted text-muted-foreground"
                      }>
                        {task.enabled ? '已启用' : '已禁用'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            {scheduledTasks.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/scheduled-tasks">
                  <Button variant="outline" size="sm">
                    管理定时任务
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 处理中任务 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-info animate-spin" />
              <span>处理中任务</span>
              <Badge variant="outline">{processingTasks.length}</Badge>
            </CardTitle>
            <CardDescription>正在执行的任务</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {processingLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">加载中...</span>
                </div>
              ) : processingTasks.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-8">
                  暂无处理中任务
                </div>
              ) : (
                processingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-info/30 bg-info/10 hover:border-info/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link href={`/tasks/${task.id}`}>
                          <span className="font-medium hover:text-primary cursor-pointer truncate">
                            {task.name}
                          </span>
                        </Link>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span className="truncate">{task.id}</span>
                        {task.assigned_worker && (
                          <>
                            <span>•</span>
                            <span>{task.assigned_worker}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatBeijingDateTimeSimple(task.started_at || task.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge className="bg-info/20 text-info-foreground">
                        执行中
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            {processingTasks.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/tasks?state=processing">
                  <Button variant="outline" size="sm">
                    查看全部
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 已完成任务（24小时内） */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span>已完成任务</span>
              <Badge variant="outline">{completedTasks.length}</Badge>
            </CardTitle>
            <CardDescription>24小时内完成的任务</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {completedTasks.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-8">
                  24小时内无已完成任务
                </div>
              ) : (
                completedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-success/30 bg-success/10 hover:border-success/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link href={`/tasks/${task.id}`}>
                          <span className="font-medium hover:text-primary cursor-pointer truncate">
                            {task.name}
                          </span>
                        </Link>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span className="truncate">{task.id}</span>
                        <span>•</span>
                        <span>{formatBeijingDateTimeSimple(task.completed_at || task.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge className="bg-success/20 text-success-foreground">
                        已完成
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            {completedTasks.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/tasks?state=completed">
                  <Button variant="outline" size="sm">
                    查看全部
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 失败任务（5天内） */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span>失败任务</span>
              <Badge variant="outline">{failedTasks.length}</Badge>
            </CardTitle>
            <CardDescription>5天内失败的任务</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {failedTasks.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-8">
                  5天内无失败任务
                </div>
              ) : (
                failedTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/10 hover:border-destructive/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link href={`/tasks/${task.id}`}>
                          <span className="font-medium hover:text-primary cursor-pointer truncate">
                            {task.name}
                          </span>
                        </Link>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span className="truncate">{task.id}</span>
                        <span>•</span>
                        <span>{formatBeijingDateTimeSimple(task.created_at)}</span>
                        {task.last_error && (
                          <>
                            <span>•</span>
                            <span className="text-destructive truncate" title={task.last_error}>
                              {task.last_error.length > 30 ? task.last_error.substring(0, 30) + '...' : task.last_error}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge className="bg-destructive/20 text-destructive-foreground">
                        失败
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            {failedTasks.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/tasks?state=failed">
                  <Button variant="outline" size="sm">
                    查看全部
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}