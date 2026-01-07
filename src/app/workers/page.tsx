'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Cpu,
  MemoryStick,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Server,
  Terminal,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react'
import { formatDateTime, formatDuration, formatPercentage } from '@/lib/utils'
import { WorkerStatus, ProcessState } from '@/types'
import { useWorkers, useRestartWorker } from '@/hooks/use-system'
import { useWebSocket, useWorkerStatus } from '@/hooks/use-websocket'
import { ConnectionStatus } from '@/services/websocket'

// 模拟工作器数据
const mockWorkers: WorkerStatus[] = [
  {
    worker_id: 'worker_01',
    process_id: 12345,
    state: ProcessState.RUNNING,
    current_task_id: 'task_001',
    last_heartbeat: new Date(Date.now() - 30000).toISOString(), // 30秒前
    cpu_usage: 45.2,
    memory_usage: 256 * 1024 * 1024, // 256MB in bytes
    uptime_seconds: 86400, // 1天
    tasks_completed: 142,
    tasks_failed: 6
  },
  {
    worker_id: 'worker_02',
    process_id: 12346,
    state: ProcessState.RUNNING,
    current_task_id: 'task_002',
    last_heartbeat: new Date(Date.now() - 15000).toISOString(), // 15秒前
    cpu_usage: 23.8,
    memory_usage: 180 * 1024 * 1024, // 180MB in bytes
    uptime_seconds: 43200, // 12小时
    tasks_completed: 89,
    tasks_failed: 2
  },
  {
    worker_id: 'worker_03',
    process_id: null,
    state: ProcessState.KILLED,
    current_task_id: null,
    last_heartbeat: new Date(Date.now() - 300000).toISOString(), // 5分钟前
    cpu_usage: 0,
    memory_usage: 0,
    uptime_seconds: 0,
    tasks_completed: 56,
    tasks_failed: 12
  }
]

export default function WorkersPage() {
  // WebSocket连接状态
  const { connectionStatus, isConnected, connect } = useWebSocket()
  
  // 实时工作器状态
  const { workersList: realtimeWorkers, onlineWorkers } = useWorkerStatus()
  
  // 静态数据（回退）
  const { data: staticWorkers, isLoading, refetch } = useWorkers()
  const restartWorkerMutation = useRestartWorker()

  // 合并实时数据和静态数据
  const workers = realtimeWorkers.length > 0 ? realtimeWorkers.map(worker => ({
    worker_id: worker.workerId,
    process_id: null, // 这个属性在WebSocket数据中没有
    state: worker.status === 'online' ? ProcessState.RUNNING :
           worker.status === 'busy' ? ProcessState.RUNNING :
           worker.status === 'idle' ? ProcessState.RUNNING : ProcessState.KILLED,
    current_task_id: worker.currentTask || null,
    last_heartbeat: new Date(worker.lastSeen).toISOString(),
    cpu_usage: 0, // 需要从其他数据源获取
    memory_usage: 0, // 需要从其他数据源获取
    uptime_seconds: Math.floor((Date.now() - worker.lastSeen) / 1000),
    tasks_completed: worker.performance.tasksCompleted,
    tasks_failed: Math.floor(worker.performance.tasksCompleted * worker.performance.errorRate)
  })) : (staticWorkers || mockWorkers)

  const [selectedWorker, setSelectedWorker] = useState<string | null>(null)
  
  // 自动连接WebSocket
  useEffect(() => {
    if (!isConnected && connectionStatus === ConnectionStatus.DISCONNECTED) {
      connect()
    }
  }, [isConnected, connectionStatus, connect])

  const handleRestartWorker = async (workerId: string) => {
    try {
      await restartWorkerMutation.mutateAsync(workerId)
    } catch (error) {
      console.error('Failed to restart worker:', error)
    }
  }

  const getWorkerStateLabel = (state: ProcessState) => {
    const labels = {
      spawning: '启动中',
      running: '运行中',
      hung: '挂起',
      terminating: '终止中',
      killed: '已停止',
      restarting: '重启中'
    }
    return labels[state] || state
  }

  const getWorkerStateColor = (state: ProcessState) => {
    const colors = {
      spawning: 'text-blue-600 bg-blue-50',
      running: 'text-green-600 bg-green-50',
      hung: 'text-orange-600 bg-orange-50',
      terminating: 'text-yellow-600 bg-yellow-50',
      killed: 'text-red-600 bg-red-50',
      restarting: 'text-purple-600 bg-purple-50'
    }
    return colors[state] || 'text-gray-600 bg-gray-50'
  }

  const getHealthStatus = (worker: WorkerStatus) => {
    const heartbeatAge = Date.now() - new Date(worker.last_heartbeat).getTime()
    if (worker.state === ProcessState.KILLED || worker.state === ProcessState.TERMINATING) {
      return { status: 'offline', label: '离线', color: 'text-red-600' }
    }
    if (heartbeatAge > 120000) { // 超过2分钟没有心跳
      return { status: 'unhealthy', label: '异常', color: 'text-orange-600' }
    }
    if (worker.state === ProcessState.RUNNING) {
      return { status: 'healthy', label: '健康', color: 'text-green-600' }
    }
    return { status: 'warning', label: '警告', color: 'text-yellow-600' }
  }

  const formatMemoryUsage = (bytes: number) => {
    return `${Math.round(bytes / (1024 * 1024))} MB`
  }

  const getSuccessRate = (completed: number, failed: number) => {
    const total = completed + failed
    return total === 0 ? 0 : (completed / total) * 100
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">加载工作器信息...</div>
        </div>
      </div>
    )
  }

  const runningWorkers = workers.filter(w => w.state === ProcessState.RUNNING).length
  const totalTasks = workers.reduce((sum, w) => sum + w.tasks_completed + w.tasks_failed, 0)
  const completedTasks = workers.reduce((sum, w) => sum + w.tasks_completed, 0)
  const failedTasks = workers.reduce((sum, w) => sum + w.tasks_failed, 0)

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">工作器管理</h1>
          <p className="text-muted-foreground">管理和监控Claude执行工作器</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* WebSocket连接状态指示器 */}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-muted/50">
            {connectionStatus === ConnectionStatus.CONNECTED ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">实时监控</span>
              </>
            ) : connectionStatus === ConnectionStatus.CONNECTING ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                <span className="text-sm text-yellow-600">连接中</span>
              </>
            ) : connectionStatus === ConnectionStatus.RECONNECTING ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                <span className="text-sm text-orange-600">重连中</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">已断开</span>
              </>
            )}
          </div>
          
          {isConnected && realtimeWorkers.length > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              实时数据
            </Badge>
          )}
          
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新状态
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总工作器</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workers.length}</div>
            <p className="text-xs text-muted-foreground">
              {runningWorkers} 个运行中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">任务完成率</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTasks === 0 ? '0' : formatPercentage(getSuccessRate(completedTasks, failedTasks))}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} 成功 / {totalTasks} 总计
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均CPU使用率</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(
                workers.filter(w => w.state === ProcessState.RUNNING)
                  .reduce((sum, w) => sum + (w.cpu_usage || 0), 0) / runningWorkers || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              活跃工作器平均值
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内存使用</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMemoryUsage(
                workers.reduce((sum, w) => sum + (w.memory_usage || 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              总内存占用
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workers.map((worker) => {
          const health = getHealthStatus(worker)
          const heartbeatAge = Date.now() - new Date(worker.last_heartbeat).getTime()
          
          return (
            <Card key={worker.worker_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>{worker.worker_id}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-1 ${health.color}`}>
                      <div className="w-2 h-2 rounded-full bg-current"></div>
                      <span className="text-sm font-medium">{health.label}</span>
                    </div>
                    <Badge className={getWorkerStateColor(worker.state)}>
                      {getWorkerStateLabel(worker.state)}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  PID: {worker.process_id || 'N/A'} • 
                  运行时长: {formatDuration(worker.uptime_seconds)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Task */}
                {worker.current_task_id ? (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Terminal className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">执行中任务</span>
                    </div>
                    <div className="text-sm text-blue-700">{worker.current_task_id}</div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">暂无执行任务</div>
                  </div>
                )}

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">CPU使用率</div>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((worker.cpu_usage || 0), 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {formatPercentage(worker.cpu_usage || 0)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">内存使用</div>
                    <div className="text-sm font-medium">
                      {formatMemoryUsage(worker.memory_usage || 0)}
                    </div>
                  </div>
                </div>

                {/* Task Statistics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{worker.tasks_completed}</div>
                    <div className="text-xs text-muted-foreground">已完成</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">{worker.tasks_failed}</div>
                    <div className="text-xs text-muted-foreground">失败</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatPercentage(getSuccessRate(worker.tasks_completed, worker.tasks_failed))}
                    </div>
                    <div className="text-xs text-muted-foreground">成功率</div>
                  </div>
                </div>

                {/* Heartbeat Info */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span>最后心跳</span>
                    </div>
                    <div className={heartbeatAge > 120000 ? 'text-orange-600' : 'text-green-600'}>
                      {Math.round(heartbeatAge / 1000)}秒前
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  {worker.state === ProcessState.RUNNING && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRestartWorker(worker.worker_id)}
                      disabled={restartWorkerMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      重启
                    </Button>
                  )}
                  
                  {worker.state === ProcessState.KILLED && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRestartWorker(worker.worker_id)}
                      disabled={restartWorkerMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      启动
                    </Button>
                  )}
                  
                  {worker.state === ProcessState.HUNG && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRestartWorker(worker.worker_id)}
                      disabled={restartWorkerMutation.isPending}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      修复
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System-wide Actions */}
      <Card>
        <CardHeader>
          <CardTitle>批量操作</CardTitle>
          <CardDescription>对所有工作器执行批量管理操作</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button variant="outline" disabled={restartWorkerMutation.isPending}>
              <RotateCcw className="h-4 w-4 mr-2" />
              重启所有工作器
            </Button>
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              健康检查
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新所有状态
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}