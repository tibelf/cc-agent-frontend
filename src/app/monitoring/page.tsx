'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableColumn } from '@/components/ui/table'
import { 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Zap,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { Alert, AlertLevel, SystemMetrics } from '@/types'
import { useAlerts, useSystemMetrics, useResolveAlert } from '@/hooks/use-system'
import { useWebSocket, useSystemMetrics as useRealtimeMetrics, useAlerts as useRealtimeAlerts } from '@/hooks/use-websocket'
import { ConnectionStatus } from '@/services/websocket'

// 模拟告警数据
const mockAlerts: Alert[] = [
  {
    id: 'alert_001',
    level: AlertLevel.P1,
    title: '磁盘空间不足',
    message: '系统磁盘剩余空间仅有 2.1GB，请及时清理',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    metadata: {
      disk_path: '/',
      free_space_gb: 2.1,
      threshold_gb: 5.0
    }
  },
  {
    id: 'alert_002',
    level: AlertLevel.P2,
    title: '工作器响应超时',
    message: 'worker_03 心跳超时超过 5 分钟',
    worker_id: 'worker_03',
    created_at: new Date(Date.now() - 300000).toISOString(),
    metadata: {
      last_heartbeat: new Date(Date.now() - 300000).toISOString(),
      timeout_seconds: 300
    }
  },
  {
    id: 'alert_003',
    level: AlertLevel.P3,
    title: '任务重试次数过多',
    message: '任务 task_005 重试次数达到 4 次',
    task_id: 'task_005',
    created_at: new Date(Date.now() - 900000).toISOString(),
    metadata: {
      retry_count: 4,
      max_retries: 5
    }
  },
  {
    id: 'alert_004',
    level: AlertLevel.P2,
    title: '内存使用率过高',
    message: '系统内存使用率达到 89%，建议检查任务负载',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    resolved_at: new Date(Date.now() - 3600000).toISOString(),
    metadata: {
      memory_usage_percent: 89,
      threshold_percent: 85
    }
  }
]

// 模拟系统指标数据
const mockMetrics: SystemMetrics[] = Array.from({ length: 24 }, (_, i) => ({
  timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
  disk_free_gb: 45.2 + Math.random() * 5,
  memory_usage_percent: 65 + Math.random() * 20,
  cpu_usage_percent: 35 + Math.random() * 30,
  active_workers: 2 + Math.floor(Math.random() * 2),
  pending_tasks: Math.floor(Math.random() * 10),
  processing_tasks: Math.floor(Math.random() * 5),
  failed_tasks: Math.floor(Math.random() * 3),
  completed_tasks: 10 + Math.floor(Math.random() * 20)
}))

export default function MonitoringPage() {
  // WebSocket连接状态
  const { connectionStatus, isConnected, connect } = useWebSocket()
  
  // 实时系统指标
  const { metrics: realtimeMetrics, history: metricsHistory } = useRealtimeMetrics()
  
  // 实时告警
  const { alerts: realtimeAlerts } = useRealtimeAlerts()
  
  // 静态数据（回退）
  const { data: staticAlerts } = useAlerts()
  const { data: staticMetrics } = useSystemMetrics(24)
  const resolveAlertMutation = useResolveAlert()

  // 合并实时数据和静态数据
  const alerts = realtimeAlerts.length > 0 ? realtimeAlerts.map(alert => ({
    id: alert.id,
    level: alert.level === 'critical' ? AlertLevel.P1 : 
           alert.level === 'error' ? AlertLevel.P1 :
           alert.level === 'warning' ? AlertLevel.P2 : AlertLevel.P3,
    title: alert.title,
    message: alert.message,
    created_at: new Date(alert.timestamp).toISOString(),
    resolved_at: undefined,
    metadata: {}
  })) : (staticAlerts?.data || mockAlerts)
  
  const metrics = metricsHistory.length > 0 ? metricsHistory.map(m => ({
    timestamp: new Date().toISOString(),
    disk_free_gb: 100 - m.disk, // 转换为剩余空间
    memory_usage_percent: m.memory,
    cpu_usage_percent: m.cpu,
    active_workers: 0, // 这些数据需要从其他源获取
    pending_tasks: m.activeTasks,
    processing_tasks: m.activeTasks,
    failed_tasks: m.failedTasks,
    completed_tasks: m.completedTasks
  })) : (staticMetrics?.data || mockMetrics)

  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [alertsPage, setAlertsPage] = useState(1)
  const [alertsPageSize, setAlertsPageSize] = useState(10)
  
  // 自动连接WebSocket
  useEffect(() => {
    if (!isConnected && connectionStatus === ConnectionStatus.DISCONNECTED) {
      connect()
    }
  }, [isConnected, connectionStatus, connect])

  const handleResolveAlert = async (alertId: string, resolution?: string) => {
    try {
      await resolveAlertMutation.mutateAsync({ alertId, resolution })
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  const getAlertLevelColor = (level: AlertLevel) => {
    const colors = {
      P1: 'text-red-600 bg-red-50 border-red-200',
      P2: 'text-orange-600 bg-orange-50 border-orange-200',
      P3: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
    return colors[level] || 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getAlertLevelLabel = (level: AlertLevel) => {
    const labels = {
      P1: '严重',
      P2: '警告', 
      P3: '信息'
    }
    return labels[level] || level
  }

  const activeAlerts = alerts.filter(a => !a.resolved_at)
  const resolvedAlerts = alerts.filter(a => a.resolved_at)
  const criticalAlerts = activeAlerts.filter(a => a.level === AlertLevel.P1)

  // 计算最新指标
  const latestMetrics = metrics[metrics.length - 1]
  const previousMetrics = metrics[metrics.length - 2]

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  // 告警表格列配置
  const alertColumns: TableColumn<typeof alerts[0]>[] = [
    {
      key: 'level',
      title: '优先级',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: '严重', value: 'P1' },
        { label: '警告', value: 'P2' },
        { label: '信息', value: 'P3' }
      ],
      width: 100,
      align: 'center',
      render: (value) => (
        <Badge className={getAlertLevelColor(value as AlertLevel)}>
          {getAlertLevelLabel(value as AlertLevel)}
        </Badge>
      )
    },
    {
      key: 'title',
      title: '标题',
      sortable: true,
      filterable: true,
      filterType: 'search',
      width: 200
    },
    {
      key: 'message',
      title: '描述',
      filterable: true,
      filterType: 'search',
      render: (value) => (
        <div className="max-w-xs truncate" title={String(value)}>
          {String(value)}
        </div>
      )
    },
    {
      key: 'created_at',
      title: '创建时间',
      sortable: true,
      width: 150,
      render: (value) => formatDateTime(String(value))
    },
    {
      key: 'resolved_at',
      title: '状态',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: '活跃', value: 'active' },
        { label: '已解决', value: 'resolved' }
      ],
      width: 100,
      align: 'center',
      render: (value) => (
        <Badge variant={value ? 'outline' : 'default'} className={value ? 'text-green-600 bg-green-100' : 'text-orange-600 bg-orange-100'}>
          {value ? '已解决' : '活跃'}
        </Badge>
      )
    },
    {
      key: 'id',
      title: '操作',
      width: 120,
      align: 'center',
      render: (value, record) => (
        <div className="flex items-center space-x-1">
          {!record.resolved_at && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolveAlert(record.id)}
              disabled={resolveAlertMutation.isPending}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              解决
            </Button>
          )}
        </div>
      )
    }
  ]

  const handleAlertsPageChange = (page: number, pageSize: number) => {
    setAlertsPage(page)
    setAlertsPageSize(pageSize)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">监控告警</h1>
          <p className="text-muted-foreground">系统性能监控和告警管理</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* WebSocket连接状态指示器 */}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-muted/50">
            {connectionStatus === ConnectionStatus.CONNECTED ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">实时连接</span>
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
          
          {isConnected && realtimeMetrics && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              实时数据
            </Badge>
          )}
          
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃告警</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalAlerts.length} 个严重告警
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已解决</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              过去24小时内
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统健康度</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">良好</div>
            <p className="text-xs text-muted-foreground">
              所有关键服务运行正常
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3s</div>
            <p className="text-xs text-muted-foreground">
              过去1小时平均值
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>系统性能指标</CardTitle>
            <div className="flex items-center space-x-2">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="text-sm border border-input rounded px-2 py-1"
              >
                <option value="1h">过去1小时</option>
                <option value="6h">过去6小时</option>
                <option value="24h">过去24小时</option>
                <option value="7d">过去7天</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">CPU使用率</span>
                </div>
                {getTrendIcon(latestMetrics.cpu_usage_percent, previousMetrics.cpu_usage_percent)}
              </div>
              <div className="text-2xl font-bold">
                {latestMetrics.cpu_usage_percent.toFixed(1)}%
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(latestMetrics.cpu_usage_percent, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">内存使用率</span>
                </div>
                {getTrendIcon(latestMetrics.memory_usage_percent, previousMetrics.memory_usage_percent)}
              </div>
              <div className="text-2xl font-bold">
                {latestMetrics.memory_usage_percent.toFixed(1)}%
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(latestMetrics.memory_usage_percent, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">磁盘剩余</span>
                </div>
                {getTrendIcon(latestMetrics.disk_free_gb, previousMetrics.disk_free_gb)}
              </div>
              <div className="text-2xl font-bold">
                {latestMetrics.disk_free_gb.toFixed(1)}GB
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(latestMetrics.disk_free_gb / 100 * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">活跃工作器</span>
                </div>
                {getTrendIcon(latestMetrics.active_workers, previousMetrics.active_workers)}
              </div>
              <div className="text-2xl font-bold">
                {latestMetrics.active_workers}
              </div>
              <div className="text-xs text-muted-foreground">
                处理 {latestMetrics.processing_tasks} 个任务
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 告警列表 - 使用Table组件 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>系统告警</span>
            <Badge variant="outline">{alerts.length}</Badge>
          </CardTitle>
          <CardDescription>
            显示所有系统告警信息，支持按优先级、状态筛选和排序
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            data={alerts as Record<string, unknown>[]}
            columns={alertColumns as TableColumn<Record<string, unknown>>[]}
            pagination={{
              page: alertsPage,
              pageSize: alertsPageSize,
              total: alerts.length,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50],
              onPageChange: handleAlertsPageChange
            }}
            sorting={{
              defaultSort: { column: 'created_at', direction: 'desc' }
            }}
            rowKey="id"
            emptyText="暂无告警信息"
            rowClassName={(record) => record.resolved_at ? 'opacity-75' : ''}
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>系统维护和监控操作</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Zap className="h-6 w-6 mb-2" />
              系统健康检查
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              生成性能报告
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <RefreshCw className="h-6 w-6 mb-2" />
              刷新所有指标
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}