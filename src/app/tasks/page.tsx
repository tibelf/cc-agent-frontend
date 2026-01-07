'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { List, ListColumn } from '@/components/ui/list'
import { 
  Plus,
  Play,
  Pause,
  Square,
  RotateCcw,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { formatDateTime, formatRelativeTime, formatBeijingDateTimeSimple, getTaskStateColor, getPriorityColor } from '@/lib/utils'
import { TaskState, TaskPriority } from '@/types'
import { useCLITasks, useCLITaskStats, useCLITaskAction, useCLIAvailability } from '@/hooks/use-cli-tasks'

const TASK_STATES = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '等待中' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
  { value: 'paused', label: '暂停' },
  { value: 'waiting_unban', label: '等待解封' },
  { value: 'retrying', label: '重试中' }
]

const PRIORITIES = [
  { value: '', label: '全部优先级' },
  { value: 'urgent', label: '紧急' },
  { value: 'high', label: '高' },
  { value: 'normal', label: '普通' },
  { value: 'low', label: '低' }
]

export default function TasksPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // 检查CLI可用性
  const { data: isCliAvailable, isLoading: checkingCli } = useCLIAvailability()
  
  // 获取任务数据
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError, refetch: refetchTasks } = useCLITasks({ enabled: isCliAvailable })
  const { data: taskStats, isLoading: statsLoading, refetch: refetchStats } = useCLITaskStats()
  
  // 任务操作
  const taskActionMutation = useCLITaskAction()

  const getTaskStateLabel = (state: string) => {
    const labels = {
      pending: '等待中',
      processing: '处理中',
      completed: '已完成',
      failed: '失败',
      paused: '暂停',
      waiting_unban: '等待解封',
      retrying: '重试中',
      needs_human_review: '需要审核',
      awaiting_confirmation: '等待确认'
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

  const handleTaskAction = async (taskId: string, action: string, taskState?: string) => {
    try {
      const force = action === 'retry' && taskState === 'completed'
      await taskActionMutation.mutateAsync({
        taskId,
        action: action as 'cancel' | 'retry' | 'pause' | 'resume',
        force
      })
    } catch (error) {
      console.error(`任务${action}失败:`, error)
    }
  }

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page)
    setPageSize(size)
  }

  // 处理手动刷新
  const handleRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await Promise.all([
        refetchTasks(),
        refetchStats()
      ])
      
      // 显示成功反馈
      const successToast = document.createElement('div')
      successToast.className = 'fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg transition-opacity duration-300'
      successToast.innerHTML = '✓ 数据刷新成功'
      document.body.appendChild(successToast)
      
      setTimeout(() => {
        successToast.style.opacity = '0'
        setTimeout(() => {
          document.body.removeChild(successToast)
        }, 300)
      }, 2000)
      
    } catch (error) {
      console.error('刷新数据失败:', error)
      
      // 显示失败反馈
      const errorToast = document.createElement('div')
      errorToast.className = 'fixed top-4 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg transition-opacity duration-300'
      errorToast.innerHTML = '✗ 数据刷新失败'
      document.body.appendChild(errorToast)
      
      setTimeout(() => {
        errorToast.style.opacity = '0'
        setTimeout(() => {
          document.body.removeChild(errorToast)
        }, 300)
      }, 3000)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 定义List组件的列配置
  const columns: ListColumn<typeof tasks[0]>[] = [
    {
      key: 'name',
      title: '任务名称',
      sortable: true,
      filterable: true,
      filterType: 'search'
    },
    {
      key: 'task_state',
      title: '状态',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: TASK_STATES.slice(1).map(state => ({
        label: state.label,
        value: state.value
      }))
    },
    {
      key: 'priority',
      title: '优先级',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: PRIORITIES.slice(1).map(priority => ({
        label: priority.label,
        value: priority.value
      }))
    },
    {
      key: 'task_type',
      title: '任务类型',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: '轻量级', value: 'lightweight' },
        { label: '中等上下文', value: 'medium_context' },
        { label: '重上下文', value: 'heavy_context' }
      ]
    },
    {
      key: 'created_at',
      title: '创建时间',
      sortable: true
    }
  ]

  // 渲染任务卡片
  const renderTaskItem = (task: typeof tasks[0]) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Task Name and ID */}
            <div className="flex items-center space-x-2 mb-2">
              <Link href={`/tasks/${task.id}`}>
                <h3 className="text-lg font-semibold hover:text-primary cursor-pointer truncate">
                  {task.name}
                </h3>
              </Link>
              <Badge variant="outline" className="text-xs">
                {task.id}
              </Badge>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
              <span>类型: {getTypeLabel(task.task_type)}</span>
              {task.assigned_worker && (
                <>
                  <span>•</span>
                  <span>工作器: {task.assigned_worker}</span>
                </>
              )}
              <span>•</span>
              <span>创建: {formatBeijingDateTimeSimple(task.created_at)}</span>
              {task.retry_count > 0 && (
                <>
                  <span>•</span>
                  <span>重试: {task.retry_count}次</span>
                </>
              )}
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Error Message */}
            {task.last_error && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-3">
                错误: {task.last_error}
              </div>
            )}

            {/* Wait Time */}
            {task.next_allowed_at && new Date(task.next_allowed_at) > new Date() && (
              <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded mb-3">
                等待至: {formatBeijingDateTimeSimple(task.next_allowed_at)}
              </div>
            )}
          </div>

          {/* Status and Actions */}
          <div className="flex flex-col items-end space-y-2 ml-4">
            {/* Status Badges */}
            <div className="flex flex-col items-end space-y-1">
              <Badge className={getTaskStateColor(task.task_state)}>
                {getTaskStateLabel(task.task_state)}
              </Badge>
              <Badge className={getPriorityColor(task.priority)}>
                {getPriorityLabel(task.priority)}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              {task.task_state === 'processing' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTaskAction(task.id, 'pause', task.task_state)
                  }}
                >
                  <Pause className="h-3 w-3 mr-1" />
                  暂停
                </Button>
              )}
              
              {task.task_state === 'paused' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTaskAction(task.id, 'resume', task.task_state)
                  }}
                >
                  <Play className="h-3 w-3 mr-1" />
                  恢复
                </Button>
              )}
              
              {['failed', 'completed'].includes(task.task_state) && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTaskAction(task.id, 'retry', task.task_state)
                  }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  重试
                </Button>
              )}
              
              {['pending', 'paused'].includes(task.task_state) && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTaskAction(task.id, 'cancel', task.task_state)
                  }}
                >
                  <Square className="h-3 w-3 mr-1" />
                  取消
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">任务管理</h1>
          <p className="text-muted-foreground">创建、管理和监控Claude代码任务</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing || tasksLoading || statsLoading}
            className={isRefreshing ? 'opacity-75' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing || tasksLoading || statsLoading ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中...' : '刷新'}
          </Button>
          <Link href="/tasks/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建任务
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {isCliAvailable && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {statsLoading ? '-' : (taskStats?.pending || 0)}
                </div>
                <div className="text-sm text-muted-foreground">等待中</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {statsLoading ? '-' : (taskStats?.processing || 0)}
                </div>
                <div className="text-sm text-muted-foreground">处理中</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {statsLoading ? '-' : (taskStats?.completed || 0)}
                </div>
                <div className="text-sm text-muted-foreground">已完成</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {statsLoading ? '-' : (taskStats?.failed || 0)}
                </div>
                <div className="text-sm text-muted-foreground">失败</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CLI可用性检查 */}
      {checkingCli && (
        <Card>
          <CardContent className="pt-6 text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">检查cc-agent可用性...</p>
          </CardContent>
        </Card>
      )}

      {/* CLI不可用提示 */}
      {!checkingCli && isCliAvailable === false && (
        <Card>
          <CardContent className="pt-6 text-center py-8">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">cc-agent 不可用</h3>
            <p className="text-muted-foreground mb-4">
              无法连接到cc-agent命令行工具。请确保：
            </p>
            <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
              <li>• cc-agent项目位于: /Users/tibelf/Github/cc-agent</li>
              <li>• Python环境已正确安装</li>
              <li>• taskctl.py可执行</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 使用新的List组件 */}
      {isCliAvailable && (
        <List
          data={tasks}
          loading={tasksLoading}
          columns={columns}
          renderItem={(task) => renderTaskItem(task)}
          pagination={{
            page: currentPage,
            pageSize: pageSize,
            total: tasks.length,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20, 50],
            onPageChange: handlePageChange
          }}
          sorting={{
            defaultSort: { column: 'created_at', direction: 'desc' }
          }}
          emptyText={tasksError ? `加载任务失败: ${tasksError.message}` : '没有找到符合条件的任务'}
          rowKey="id"
          onItemClick={(task) => window.location.href = `/tasks/${task.id}`}
          layout="list"
        />
      )}

    </div>
  )
}