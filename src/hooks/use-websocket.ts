import { useEffect, useState, useCallback, useRef } from 'react'
import { 
  webSocketService,
  ConnectionStatus,
  WSMessage,
  WSEventListener,
  TaskStatusMessage,
  LogMessage,
  SystemMetricsMessage,
  WorkerStatusMessage,
  AlertMessage
} from '@/services/websocket'

// WebSocket连接Hook
export function useWebSocket() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    webSocketService.getConnectionStatus()
  )
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // 监听连接状态变化
    const unsubscribe = webSocketService.onStatusChange(setConnectionStatus)

    return unsubscribe
  }, [])

  const connect = useCallback(async () => {
    if (connectionStatus === ConnectionStatus.CONNECTED || isConnecting) {
      return
    }

    setIsConnecting(true)
    try {
      await webSocketService.connect()
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
    } finally {
      setIsConnecting(false)
    }
  }, [connectionStatus, isConnecting])

  const disconnect = useCallback(() => {
    webSocketService.disconnect()
  }, [])

  const send = useCallback((event: string, data: unknown) => {
    webSocketService.send(event, data)
  }, [])

  return {
    connectionStatus,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    isConnecting: isConnecting || connectionStatus === ConnectionStatus.CONNECTING,
    isReconnecting: connectionStatus === ConnectionStatus.RECONNECTING,
    connect,
    disconnect,
    send
  }
}

// 通用消息监听Hook
export function useWebSocketMessage<T extends WSMessage>(
  event: string,
  listener: WSEventListener<T>,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const unsubscribe = webSocketService.on(event, listener)
    return unsubscribe
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}

// 任务状态监听Hook
export function useTaskStatus(taskId?: string) {
  const [taskStatus, setTaskStatus] = useState<TaskStatusMessage['data'] | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  const handleTaskStatus = useCallback((message: TaskStatusMessage) => {
    if (!taskId || message.data.taskId === taskId) {
      setTaskStatus(message.data)
      setLastUpdate(Date.now())
    }
  }, [taskId])

  useWebSocketMessage('task_status', handleTaskStatus, [taskId])

  // 订阅特定任务
  useEffect(() => {
    if (taskId) {
      webSocketService.subscribeToTask(taskId)
      return () => {
        webSocketService.unsubscribeFromTask(taskId)
      }
    }
  }, [taskId])

  return {
    taskStatus,
    lastUpdate
  }
}

// 任务日志监听Hook
export function useTaskLogs(taskId?: string, maxLogs: number = 1000) {
  const [logs, setLogs] = useState<LogMessage['data'][]>([])
  const [isAutoScroll, setIsAutoScroll] = useState(true)

  const handleLog = useCallback((message: LogMessage) => {
    if (!taskId || message.data.taskId === taskId) {
      setLogs(prevLogs => {
        const newLogs = [...prevLogs, message.data]
        // 保持最大日志数量限制
        return newLogs.slice(-maxLogs)
      })
    }
  }, [taskId, maxLogs])

  useWebSocketMessage('task_log', handleLog, [taskId])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  const toggleAutoScroll = useCallback(() => {
    setIsAutoScroll(prev => !prev)
  }, [])

  return {
    logs,
    isAutoScroll,
    clearLogs,
    toggleAutoScroll,
    setIsAutoScroll
  }
}

// 系统指标监听Hook
export function useSystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetricsMessage['data'] | null>(null)
  const [history, setHistory] = useState<SystemMetricsMessage['data'][]>([])
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  const handleMetrics = useCallback((message: SystemMetricsMessage) => {
    const newMetrics = message.data
    setMetrics(newMetrics)
    setLastUpdate(Date.now())
    
    // 保存历史数据（最近50个数据点）
    setHistory(prevHistory => {
      const newHistory = [...prevHistory, newMetrics]
      return newHistory.slice(-50)
    })
  }, [])

  useWebSocketMessage('system_metrics', handleMetrics, [])

  // 订阅系统指标
  useEffect(() => {
    webSocketService.subscribeToMetrics()
    return () => {
      webSocketService.unsubscribeFromMetrics()
    }
  }, [])

  return {
    metrics,
    history,
    lastUpdate
  }
}

// 工作器状态监听Hook
export function useWorkerStatus(workerId?: string) {
  const [workers, setWorkers] = useState<Map<string, WorkerStatusMessage['data']>>(new Map())
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  const handleWorkerStatus = useCallback((message: WorkerStatusMessage) => {
    const workerData = message.data
    if (!workerId || workerData.workerId === workerId) {
      setWorkers(prevWorkers => {
        const newWorkers = new Map(prevWorkers)
        newWorkers.set(workerData.workerId, workerData)
        return newWorkers
      })
      setLastUpdate(Date.now())
    }
  }, [workerId])

  useWebSocketMessage('worker_status', handleWorkerStatus, [workerId])

  // 订阅工作器状态
  useEffect(() => {
    webSocketService.subscribeToWorkers()
    return () => {
      webSocketService.unsubscribeFromWorkers()
    }
  }, [])

  const getWorkerById = useCallback((id: string) => {
    return workers.get(id)
  }, [workers])

  const getAllWorkers = useCallback(() => {
    return Array.from(workers.values())
  }, [workers])

  const getOnlineWorkers = useCallback(() => {
    return Array.from(workers.values()).filter(worker => 
      worker.status === 'online' || worker.status === 'busy' || worker.status === 'idle'
    )
  }, [workers])

  return {
    workers: workers,
    workersList: getAllWorkers(),
    onlineWorkers: getOnlineWorkers(),
    getWorkerById,
    lastUpdate
  }
}

// 告警监听Hook
export function useAlerts(maxAlerts: number = 100) {
  const [alerts, setAlerts] = useState<AlertMessage['data'][]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const handleAlert = useCallback((message: AlertMessage) => {
    setAlerts(prevAlerts => {
      const newAlerts = [message.data, ...prevAlerts]
      return newAlerts.slice(0, maxAlerts)
    })
    setUnreadCount(prev => prev + 1)
  }, [maxAlerts])

  useWebSocketMessage('alert', handleAlert, [])

  // 订阅告警
  useEffect(() => {
    webSocketService.subscribeToAlerts()
    return () => {
      webSocketService.unsubscribeFromAlerts()
    }
  }, [])

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0)
  }, [])

  const clearAlerts = useCallback(() => {
    setAlerts([])
    setUnreadCount(0)
  }, [])

  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId))
  }, [])

  const getAlertsByLevel = useCallback((level: AlertMessage['data']['level']) => {
    return alerts.filter(alert => alert.level === level)
  }, [alerts])

  return {
    alerts,
    unreadCount,
    markAllAsRead,
    clearAlerts,
    removeAlert,
    getAlertsByLevel
  }
}

// 实时数据聚合Hook
export function useRealTimeData() {
  const { connectionStatus, connect } = useWebSocket()
  const { taskStatus } = useTaskStatus()
  const { metrics } = useSystemMetrics()
  const { workersList } = useWorkerStatus()
  const { alerts, unreadCount } = useAlerts()

  // 自动连接
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.DISCONNECTED) {
      connect()
    }
  }, [connectionStatus, connect])

  return {
    connectionStatus,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    taskStatus,
    metrics,
    workers: workersList,
    alerts,
    unreadAlerts: unreadCount,
    stats: {
      onlineWorkers: workersList.filter(w => w.status !== 'offline').length,
      totalWorkers: workersList.length,
      activeTasks: metrics?.activeTasks || 0,
      criticalAlerts: alerts.filter(a => a.level === 'critical').length
    }
  }
}

// WebSocket连接管理Hook（用于全局状态）
export function useWebSocketConnection() {
  const connectionRef = useRef<boolean>(false)
  const { connectionStatus, connect, disconnect } = useWebSocket()

  // 在组件挂载时自动连接
  useEffect(() => {
    if (!connectionRef.current && connectionStatus === ConnectionStatus.DISCONNECTED) {
      connectionRef.current = true
      connect()
    }

    // 组件卸载时断开连接
    return () => {
      if (connectionRef.current) {
        disconnect()
        connectionRef.current = false
      }
    }
  }, [connectionStatus, connect, disconnect])

  return {
    connectionStatus,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED
  }
}

// 性能优化：消息队列Hook
export function useMessageQueue<T extends WSMessage>(
  event: string,
  batchSize: number = 10,
  flushInterval: number = 1000
) {
  const [messages, setMessages] = useState<T[]>([])
  const queueRef = useRef<T[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const flushQueue = useCallback(() => {
    if (queueRef.current.length > 0) {
      setMessages(prevMessages => [...prevMessages, ...queueRef.current])
      queueRef.current = []
    }
  }, [])

  const handleMessage = useCallback((message: T) => {
    queueRef.current.push(message)

    if (queueRef.current.length >= batchSize) {
      flushQueue()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    } else if (!timerRef.current) {
      timerRef.current = setTimeout(flushQueue, flushInterval)
    }
  }, [batchSize, flushInterval, flushQueue])

  useWebSocketMessage(event, handleMessage, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    queueRef.current = []
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    messages,
    clearMessages
  }
}