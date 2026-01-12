import { io, Socket } from 'socket.io-client'

// WebSocket 消息类型定义
export interface WebSocketMessage {
  type: string
  data: unknown
  timestamp: number
}

// 任务状态更新消息
export interface TaskStatusMessage extends WebSocketMessage {
  type: 'task_status'
  data: {
    taskId: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    progress?: number
    result?: unknown
    error?: string
  }
}

// 日志消息
export interface LogMessage extends WebSocketMessage {
  type: 'task_log'
  data: {
    taskId: string
    level: 'debug' | 'info' | 'warning' | 'error'
    message: string
    timestamp: number
  }
}

// 系统指标消息
export interface SystemMetricsMessage extends WebSocketMessage {
  type: 'system_metrics'
  data: {
    cpu: number
    memory: number
    disk: number
    network: {
      in: number
      out: number
    }
    activeTasks: number
    completedTasks: number
    failedTasks: number
  }
}

// 工作器状态消息
export interface WorkerStatusMessage extends WebSocketMessage {
  type: 'worker_status'
  data: {
    workerId: string
    status: 'online' | 'offline' | 'busy' | 'idle'
    currentTask?: string
    performance: {
      tasksCompleted: number
      averageResponseTime: number
      errorRate: number
    }
    lastSeen: number
  }
}

// 告警消息
export interface AlertMessage extends WebSocketMessage {
  type: 'alert'
  data: {
    id: string
    level: 'info' | 'warning' | 'error' | 'critical'
    title: string
    message: string
    source: string
    timestamp: number
  }
}

// 联合类型
export type WSMessage = TaskStatusMessage | LogMessage | SystemMetricsMessage | WorkerStatusMessage | AlertMessage

// 事件监听器类型
export type WSEventListener<T = WSMessage> = (message: T) => void

// WebSocket 连接状态
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// WebSocket 配置
export interface WebSocketConfig {
  url?: string
  reconnect?: boolean
  reconnectAttempts?: number
  reconnectDelay?: number
  timeout?: number
}

// 默认配置
const defaultConfig: WebSocketConfig = {
  url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
  reconnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 3000,
  timeout: 10000
}

class WebSocketService {
  private socket: Socket | null = null
  private config: WebSocketConfig
  private listeners: Map<string, Set<WSEventListener>> = new Map()
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set()
  private reconnectAttempt = 0

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  // 连接到WebSocket服务器
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }

      this.setConnectionStatus(ConnectionStatus.CONNECTING)

      this.socket = io(this.config.url!, {
        timeout: this.config.timeout,
        forceNew: true,
        transports: ['websocket']
      })

      // 连接成功
      this.socket.on('connect', () => {
        console.log('WebSocket connected')
        this.setConnectionStatus(ConnectionStatus.CONNECTED)
        this.reconnectAttempt = 0
        resolve()
      })

      // 连接失败
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        this.setConnectionStatus(ConnectionStatus.ERROR)
        
        if (this.config.reconnect && this.reconnectAttempt < (this.config.reconnectAttempts || 5)) {
          this.handleReconnect()
        } else {
          reject(error)
        }
      })

      // 连接断开
      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        this.setConnectionStatus(ConnectionStatus.DISCONNECTED)
        
        if (this.config.reconnect && reason === 'io server disconnect') {
          this.handleReconnect()
        }
      })

      // 消息处理
      this.socket.onAny((eventName: string, data: unknown) => {
        this.handleMessage(eventName, data)
      })

      // 设置连接超时
      setTimeout(() => {
        if (this.connectionStatus === ConnectionStatus.CONNECTING) {
          reject(new Error('Connection timeout'))
        }
      }, this.config.timeout)
    })
  }

  // 断开连接
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.setConnectionStatus(ConnectionStatus.DISCONNECTED)
  }

  // 处理重连
  private handleReconnect(): void {
    if (this.reconnectAttempt >= (this.config.reconnectAttempts || 5)) {
      console.error('Max reconnection attempts reached')
      this.setConnectionStatus(ConnectionStatus.ERROR)
      return
    }

    this.reconnectAttempt++
    this.setConnectionStatus(ConnectionStatus.RECONNECTING)

    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempt}/${this.config.reconnectAttempts})`)
      this.connect().catch(console.error)
    }, this.config.reconnectDelay)
  }

  // 设置连接状态
  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status
    this.statusListeners.forEach(listener => listener(status))
  }

  // 获取连接状态
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  // 监听连接状态变化
  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  // 发送消息
  send(event: string, data: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('WebSocket not connected, message not sent:', event, data)
    }
  }

  // 处理接收到的消息
  private handleMessage(event: string, data: unknown): void {
    const message = {
      type: event as WSMessage['type'],
      data,
      timestamp: Date.now()
    } as WSMessage

    // 触发全局监听器
    const globalListeners = this.listeners.get('*')
    if (globalListeners) {
      globalListeners.forEach(listener => listener(message))
    }

    // 触发特定事件监听器
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(listener => listener(message))
    }
  }

  // 添加事件监听器
  on<T extends WSMessage>(event: string, listener: WSEventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    const eventListeners = this.listeners.get(event)!
    eventListeners.add(listener as WSEventListener)

    // 返回取消监听的函数
    return () => {
      eventListeners.delete(listener as WSEventListener)
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  // 监听所有消息
  onAll(listener: WSEventListener): () => void {
    return this.on('*', listener)
  }

  // 移除事件监听器
  off(event: string, listener?: WSEventListener): void {
    if (!listener) {
      this.listeners.delete(event)
      return
    }

    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listener)
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  // 订阅任务更新
  subscribeToTask(taskId: string): void {
    this.send('subscribe_task', { taskId })
  }

  // 取消订阅任务
  unsubscribeFromTask(taskId: string): void {
    this.send('unsubscribe_task', { taskId })
  }

  // 订阅系统指标
  subscribeToMetrics(): void {
    this.send('subscribe_metrics', {})
  }

  // 取消订阅系统指标
  unsubscribeFromMetrics(): void {
    this.send('unsubscribe_metrics', {})
  }

  // 订阅工作器状态
  subscribeToWorkers(): void {
    this.send('subscribe_workers', {})
  }

  // 取消订阅工作器状态
  unsubscribeFromWorkers(): void {
    this.send('unsubscribe_workers', {})
  }

  // 订阅告警
  subscribeToAlerts(): void {
    this.send('subscribe_alerts', {})
  }

  // 取消订阅告警
  unsubscribeFromAlerts(): void {
    this.send('unsubscribe_alerts', {})
  }

  // 获取连接实例（用于调试）
  getSocket(): Socket | null {
    return this.socket
  }

  // 清理资源
  destroy(): void {
    this.disconnect()
    this.listeners.clear()
    this.statusListeners.clear()
  }
}

// 创建全局WebSocket服务实例
export const webSocketService = new WebSocketService()

// 导出类
export { WebSocketService }
