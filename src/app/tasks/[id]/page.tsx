'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Copy,
  RefreshCw,
  Terminal,
  Clock,
  Settings,
  Activity,
  AlertTriangle,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react'
import { formatDateTime, formatRelativeTime, formatDuration, getTaskStateColor, getPriorityColor } from '@/lib/utils'
import { Task, TaskState, TaskType, TaskPriority, ProcessState } from '@/types'
import { useTask, useTaskAction } from '@/hooks/use-tasks'
import { useWebSocket, useTaskStatus, useTaskLogs as useRealtimeTaskLogs } from '@/hooks/use-websocket'
import { ConnectionStatus } from '@/services/websocket'

// 模拟任务数据
const mockTask: Task = {
  id: 'task_001',
  name: '重构用户认证模块',
  description: '提高代码安全性，重构认证模块使其更加安全和易维护。这是一个复杂的重构任务，需要仔细处理现有的认证逻辑，确保不会破坏现有功能的同时提升系统安全性。',
  task_type: TaskType.MEDIUM_CONTEXT,
  priority: TaskPriority.HIGH,
  task_state: TaskState.PROCESSING,
  process_state: ProcessState.RUNNING,
  command: 'claude -p "请帮我重构用户认证模块，提高代码安全性" --permission-mode acceptEdits --allowedTools "Read" "Write" "Edit" "Git"',
  working_dir: '/path/to/project',
  environment: {
    NODE_ENV: 'development',
    DEBUG: 'true'
  },
  auto_execute: true,
  confirmation_strategy: 'auto_yes',
  retry_count: 1,
  max_retries: 5,
  checkpoint_data: {
    session_id: 'session_abc123',
    last_saved: new Date().toISOString(),
    progress: 0.65
  },
  created_at: new Date(Date.now() - 3600000).toISOString(),
  started_at: new Date(Date.now() - 1800000).toISOString(),
  next_allowed_at: undefined,
  tags: ['认证', '安全', '重构', '高优先级'],
  assigned_worker: 'worker_01',
  last_error: undefined,
  error_history: [
    {
      timestamp: new Date(Date.now() - 900000).toISOString(),
      type: 'warning',
      message: 'Session timeout warning - extending session'
    }
  ]
}

const mockLogs = [
  '[2024-01-20 14:30:15] Task started: 重构用户认证模块',
  '[2024-01-20 14:30:16] Analyzing current authentication structure...',
  '[2024-01-20 14:30:18] Found 5 authentication-related files',
  '[2024-01-20 14:30:20] Reading auth/models.py...',
  '[2024-01-20 14:30:22] Reading auth/views.py...',
  '[2024-01-20 14:30:25] Identifying security vulnerabilities...',
  '[2024-01-20 14:30:28] Found potential issue in password validation',
  '[2024-01-20 14:30:30] Proposing security improvements...',
  '[2024-01-20 14:30:35] Refactoring authentication middleware...',
  '[2024-01-20 14:30:38] Adding input validation...',
  '[2024-01-20 14:30:42] Implementing rate limiting...',
  '[2024-01-20 14:30:45] Creating unit tests for new auth logic...',
  '[2024-01-20 14:30:48] Running security audit...',
  '[2024-01-20 14:30:52] 📋 Progress: 65% completed',
  '[2024-01-20 14:30:55] Current operation: Updating documentation...'
]

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params.id as string

  // WebSocket连接状态
  const { connectionStatus, isConnected, connect } = useWebSocket()
  
  // 获取任务基础数据
  const { data: baseTask } = useTask(taskId)
  
  // 实时任务状态
  const { taskStatus: realtimeStatus } = useTaskStatus(taskId)
  
  // 实时日志流
  const { logs: realtimeLogs, isAutoScroll, clearLogs, toggleAutoScroll } = useRealtimeTaskLogs(taskId)
  
  // 任务操作
  const taskActionMutation = useTaskAction()

  // 合并静态数据和实时数据
  const task = baseTask?.data ? {
    ...baseTask.data,
    // 如果有实时状态更新，使用实时数据覆盖
    ...(realtimeStatus ? {
      task_state: realtimeStatus.status as TaskState,
      checkpoint_data: {
        ...baseTask.data.checkpoint_data,
        progress: realtimeStatus.progress || baseTask.data.checkpoint_data?.progress || 0
      },
      last_error: realtimeStatus.error || baseTask.data.last_error
    } : {})
  } : mockTask // 回退到模拟数据
  
  // 使用实时日志或回退到模拟数据
  const logs = realtimeLogs.length > 0 ? realtimeLogs.map(log => 
    `[${new Date(log.timestamp).toLocaleString()}] ${log.message}`
  ) : mockLogs

  const [isLogsVisible, setIsLogsVisible] = useState(true)

  // 自动连接WebSocket
  useEffect(() => {
    if (!isConnected && connectionStatus === ConnectionStatus.DISCONNECTED) {
      connect()
    }
  }, [isConnected, connectionStatus, connect])
  
  useEffect(() => {
    // 自动滚动到日志底部
    if (isAutoScroll) {
      const logsContainer = document.getElementById('logs-container')
      if (logsContainer) {
        logsContainer.scrollTop = logsContainer.scrollHeight
      }
    }
  }, [logs, isAutoScroll])

  const handleTaskAction = async (action: 'cancel' | 'retry' | 'pause' | 'resume') => {
    try {
      await taskActionMutation.mutateAsync({
        taskId,
        request: { action }
      })
    } catch (error) {
      console.error(`Failed to ${action} task:`, error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // 这里可以添加toast通知
  }

  const getTaskStateLabel = (state: string) => {
    const labels = {
      pending: '等待中',
      processing: '处理中',
      completed: '已完成',
      failed: '失败',
      paused: '暂停',
      waiting_unban: '等待解封',
      retrying: '重试中'
    }
    return labels[state as keyof typeof labels] || state
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: '紧急',
      high: '高',
      normal: '普通',
      low: '低'
    }
    return labels[priority as keyof typeof labels] || priority
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      lightweight: '轻量级',
      medium_context: '中等上下文',
      heavy_context: '重上下文'
    }
    return labels[type as keyof typeof labels] || type
  }

  if (!task) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-muted-foreground mb-2">任务未找到</div>
          <Link href="/tasks">
            <Button variant="outline">返回任务列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回任务列表
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{task.name}</h1>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <span>{task.id}</span>
              <span>•</span>
              <span>创建于 {formatRelativeTime(task.created_at)}</span>
            </div>
          </div>
        </div>
        
        {/* WebSocket Status & Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* WebSocket连接状态指示器 */}
          <div className="flex items-center space-x-2 px-2 py-1 rounded-md bg-muted/50">
            {connectionStatus === ConnectionStatus.CONNECTED ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600">实时连接</span>
              </>
            ) : connectionStatus === ConnectionStatus.CONNECTING ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                <span className="text-xs text-yellow-600">连接中</span>
              </>
            ) : connectionStatus === ConnectionStatus.RECONNECTING ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                <span className="text-xs text-orange-600">重连中</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-xs text-red-600">已断开</span>
              </>
            )}
          </div>
          
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          
          {task.task_state === TaskState.PROCESSING && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleTaskAction('pause')}
              disabled={taskActionMutation.isPending}
            >
              <Pause className="h-4 w-4 mr-2" />
              暂停
            </Button>
          )}
          
          {task.task_state === TaskState.PAUSED && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleTaskAction('resume')}
              disabled={taskActionMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              恢复
            </Button>
          )}
          
          {[TaskState.FAILED, TaskState.COMPLETED].includes(task.task_state) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleTaskAction('retry')}
              disabled={taskActionMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重试
            </Button>
          )}
          
          {task.task_state !== TaskState.PROCESSING && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleTaskAction('cancel')}
              disabled={taskActionMutation.isPending}
            >
              <Square className="h-4 w-4 mr-2" />
              取消
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>任务状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">当前状态</span>
                <Badge className={getTaskStateColor(task.task_state)}>
                  {getTaskStateLabel(task.task_state)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">优先级</span>
                <Badge className={getPriorityColor(task.priority)}>
                  {getPriorityLabel(task.priority)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">任务类型</span>
                <Badge variant="outline">
                  {getTypeLabel(task.task_type)}
                </Badge>
              </div>
              
              {task.assigned_worker && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">工作器</span>
                  <Badge variant="outline">
                    {task.assigned_worker}
                  </Badge>
                </div>
              )}
              
              {typeof task.checkpoint_data?.progress === 'number' && task.checkpoint_data.progress > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">进度</span>
                    <span className="text-sm font-medium">
                      {Math.round((task.checkpoint_data.progress as number) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(task.checkpoint_data.progress as number) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timing Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>时间信息</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">创建时间</div>
                  <div className="font-medium">{formatDateTime(task.created_at)}</div>
                </div>
                
                {task.started_at && (
                  <div>
                    <div className="text-muted-foreground">开始时间</div>
                    <div className="font-medium">{formatDateTime(task.started_at)}</div>
                  </div>
                )}
                
                {task.completed_at && (
                  <div>
                    <div className="text-muted-foreground">完成时间</div>
                    <div className="font-medium">{formatDateTime(task.completed_at)}</div>
                  </div>
                )}
                
                {task.started_at && !task.completed_at && (
                  <div>
                    <div className="text-muted-foreground">运行时长</div>
                    <div className="font-medium">
                      {formatDuration(Math.floor((Date.now() - new Date(task.started_at).getTime()) / 1000))}
                    </div>
                  </div>
                )}
              </div>
              
              {task.retry_count > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">重试次数</span>
                    <span className="text-sm font-medium">{task.retry_count}/{task.max_retries}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>配置信息</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.working_dir && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">工作目录</div>
                  <code className="text-xs bg-muted p-1 rounded">{task.working_dir}</code>
                </div>
              )}
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">自动执行</div>
                <Badge variant={task.auto_execute ? "default" : "outline"}>
                  {task.auto_execute ? '已启用' : '未启用'}
                </Badge>
              </div>
              
              {Object.keys(task.environment).length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">环境变量</div>
                  <div className="space-y-1">
                    {Object.entries(task.environment).map(([key, value]) => (
                      <div key={key} className="text-xs bg-muted p-2 rounded">
                        <span className="font-medium">{key}</span> = {value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {task.tags.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">标签</div>
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error History */}
          {task.error_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span>错误历史</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.error_history.map((error, index) => (
                    <div key={index} className="p-2 bg-orange-50 rounded text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">{error.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(error.timestamp)}
                        </span>
                      </div>
                      <div className="text-orange-800">{error.message}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>任务描述</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">
                {task.description}
              </p>
            </CardContent>
          </Card>

          {/* Command */}
          <Card>
            <CardHeader>
              <CardTitle>执行命令</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{task.command}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(task.command)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Logs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4" />
                  <span>实时日志</span>
                  <Badge variant="outline" className="ml-2">
                    {logs.length} 行
                  </Badge>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {isConnected && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      实时数据
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAutoScroll}
                  >
                    <Activity className={`h-4 w-4 mr-1 ${isAutoScroll ? 'text-green-600' : 'text-muted-foreground'}`} />
                    自动滚动
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLogsVisible(!isLogsVisible)}
                  >
                    {isLogsVisible ? '隐藏日志' : '显示日志'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearLogs}
                    disabled={logs.length === 0}
                  >
                    清空日志
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    下载
                  </Button>
                </div>
              </div>
            </CardHeader>
            {isLogsVisible && (
              <CardContent>
                <div
                  id="logs-container"
                  className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-auto font-mono text-sm"
                >
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      {isConnected ? '等待日志数据...' : '请等待WebSocket连接'}
                    </div>
                  ) : (
                    logs.map((log, index) => {
                      // 解析日志级别和颜色
                      const getLogColor = (logText: string) => {
                        if (logText.includes('ERROR') || logText.includes('错误')) return 'text-red-400'
                        if (logText.includes('WARN') || logText.includes('警告')) return 'text-yellow-400'
                        if (logText.includes('INFO') || logText.includes('信息')) return 'text-blue-400'
                        if (logText.includes('DEBUG') || logText.includes('调试')) return 'text-gray-400'
                        if (logText.includes('成功') || logText.includes('SUCCESS')) return 'text-green-400'
                        return 'text-green-400'
                      }
                      
                      return (
                        <div key={index} className={`mb-1 hover:bg-gray-800 px-1 rounded ${getLogColor(log)}`}>
                          {log}
                        </div>
                      )
                    })
                  )}
                  {task.task_state === TaskState.PROCESSING && isConnected && (
                    <div className="flex items-center mt-2 text-yellow-400">
                      <div className="animate-pulse mr-2">●</div>
                      正在执行中...
                      {realtimeStatus?.progress && (
                        <span className="ml-2">
                          (进度: {Math.round(realtimeStatus.progress * 100)}%)
                        </span>
                      )}
                    </div>
                  )}
                  {!isConnected && (
                    <div className="flex items-center mt-2 text-red-400">
                      <WifiOff className="h-4 w-4 mr-2" />
                      实时连接已断开，日志可能不是最新数据
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}