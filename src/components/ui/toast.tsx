import React, { createContext, useContext, useEffect, useState } from 'react'
import { X, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// Toast类型定义
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Toast上下文
interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast Provider
interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prevToasts => {
      const updatedToasts = [newToast, ...prevToasts]
      return updatedToasts.slice(0, maxToasts)
    })

    // 自动移除toast
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }

  const clearToasts = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Toast Hook
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  const { addToast } = context

  const toast = {
    success: (message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) =>
      addToast({ ...options, type: 'success', message }),
    
    error: (message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) =>
      addToast({ ...options, type: 'error', message }),
    
    warning: (message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) =>
      addToast({ ...options, type: 'warning', message }),
    
    info: (message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) =>
      addToast({ ...options, type: 'info', message }),
  }

  return { ...context, toast }
}

// Toast容器组件
function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// Toast项组件
interface ToastItemProps {
  toast: Toast
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // 入场动画
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => {
      removeToast(toast.id)
    }, 300) // 等待动画完成
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-orange-50 border-orange-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300',
        getBackgroundColor(),
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
        isLeaving && 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {toast.title}
            </p>
          )}
          <p className="text-sm text-gray-700">
            {toast.message}
          </p>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// 简化的Toast组件用于手动使用
interface SimpleToastProps {
  type: ToastType
  title?: string
  message: string
  onClose?: () => void
  className?: string
}

export function SimpleToast({
  type,
  title,
  message,
  onClose,
  className
}: SimpleToastProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-orange-50 border-orange-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-sm',
        getBackgroundColor(),
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {title}
            </p>
          )}
          <p className="text-sm text-gray-700">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Toast Hook的便捷方法
export const toast = {
  success: (message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) => {
    // 这个函数需要在ToastProvider内部使用
    console.warn('toast.success() can only be used inside ToastProvider. Use useToast() hook instead.')
  },
  error: (message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) => {
    console.warn('toast.error() can only be used inside ToastProvider. Use useToast() hook instead.')
  },
  warning: (message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) => {
    console.warn('toast.warning() can only be used inside ToastProvider. Use useToast() hook instead.')
  },
  info: (message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) => {
    console.warn('toast.info() can only be used inside ToastProvider. Use useToast() hook instead.')
  }
}

// 全局Toast管理器（用于在React外部调用）
class ToastManager {
  private listeners: Array<(toast: Omit<Toast, 'id'>) => void> = []

  subscribe(listener: (toast: Omit<Toast, 'id'>) => void) {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private emit(toast: Omit<Toast, 'id'>) {
    this.listeners.forEach(listener => listener(toast))
  }

  success(message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) {
    this.emit({ ...options, type: 'success', message })
  }

  error(message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) {
    this.emit({ ...options, type: 'error', message })
  }

  warning(message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) {
    this.emit({ ...options, type: 'warning', message })
  }

  info(message: string, options?: Partial<Omit<Toast, 'type' | 'message'>>) {
    this.emit({ ...options, type: 'info', message })
  }
}

export const globalToast = new ToastManager()

// 用于连接全局Toast管理器和React上下文的Hook
export function useGlobalToastConnection() {
  const { addToast } = useToast()

  useEffect(() => {
    const unsubscribe = globalToast.subscribe(addToast)
    return unsubscribe
  }, [addToast])
}