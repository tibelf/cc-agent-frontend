import React from 'react'
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  FileX, 
  SearchX, 
  WifiOff,
  Server,
  Ban
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// 错误边界组件
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
    
    // 调用错误处理回调
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent 
          error={this.state.error} 
          retry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

// 默认错误回退组件
interface DefaultErrorFallbackProps {
  error?: Error
  retry?: () => void
}

function DefaultErrorFallback({ error, retry }: DefaultErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 text-center">
      <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-foreground mb-2">出错了</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error?.message || '应用程序遇到了一个意外错误，请尝试刷新页面'}
      </p>
      <div className="flex space-x-4">
        <Button onClick={retry} variant="default">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          <Home className="h-4 w-4 mr-2" />
          回到首页
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-8 text-left max-w-2xl">
          <summary className="cursor-pointer font-semibold">错误详情（仅开发模式）</summary>
          <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  )
}

// 通用错误状态组件
interface ErrorStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'error' | 'network' | 'forbidden' | 'notFound' | 'server'
  className?: string
}

export function ErrorState({
  title,
  description,
  action,
  variant = 'error',
  className
}: ErrorStateProps) {
  const getIcon = () => {
    switch (variant) {
      case 'network':
        return <WifiOff className="h-16 w-16" />
      case 'forbidden':
        return <Ban className="h-16 w-16" />
      case 'notFound':
        return <SearchX className="h-16 w-16" />
      case 'server':
        return <Server className="h-16 w-16" />
      default:
        return <AlertTriangle className="h-16 w-16" />
    }
  }

  const getDefaultContent = () => {
    switch (variant) {
      case 'network':
        return {
          title: '网络连接失败',
          description: '请检查您的网络连接，然后重试'
        }
      case 'forbidden':
        return {
          title: '访问被拒绝',
          description: '您没有权限访问此资源'
        }
      case 'notFound':
        return {
          title: '未找到内容',
          description: '请求的资源不存在'
        }
      case 'server':
        return {
          title: '服务器错误',
          description: '服务器暂时无法响应，请稍后重试'
        }
      default:
        return {
          title: '出现错误',
          description: '发生了一个意外错误'
        }
    }
  }

  const { title: defaultTitle, description: defaultDescription } = getDefaultContent()
  const displayTitle = title || defaultTitle
  const displayDescription = description || defaultDescription

  const getColorClass = () => {
    switch (variant) {
      case 'network':
        return 'text-orange-500'
      case 'forbidden':
        return 'text-red-500'
      case 'notFound':
        return 'text-blue-500'
      case 'server':
        return 'text-red-500'
      default:
        return 'text-red-500'
    }
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-[300px] px-4 text-center',
      className
    )}>
      <div className={cn('mb-4', getColorClass())}>
        {getIcon()}
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">{displayTitle}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{displayDescription}</p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          <RefreshCw className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  )
}

// 空状态组件
interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'search' | 'data' | 'tasks' | 'workers'
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className
}: EmptyStateProps) {
  const getDefaultContent = () => {
    switch (variant) {
      case 'search':
        return {
          icon: <SearchX className="h-16 w-16 text-muted-foreground/50" />,
          title: '没有找到结果',
          description: '尝试调整您的搜索条件'
        }
      case 'data':
        return {
          icon: <FileX className="h-16 w-16 text-muted-foreground/50" />,
          title: '暂无数据',
          description: '当前没有可显示的数据'
        }
      case 'tasks':
        return {
          icon: <FileX className="h-16 w-16 text-muted-foreground/50" />,
          title: '没有任务',
          description: '您还没有创建任何任务，点击创建按钮开始'
        }
      case 'workers':
        return {
          icon: <Server className="h-16 w-16 text-muted-foreground/50" />,
          title: '没有工作器',
          description: '当前没有活跃的工作器'
        }
      default:
        return {
          icon: <FileX className="h-16 w-16 text-muted-foreground/50" />,
          title: '暂无内容',
          description: '这里还没有任何内容'
        }
    }
  }

  const defaultContent = getDefaultContent()
  const displayIcon = icon || defaultContent.icon
  const displayTitle = title || defaultContent.title
  const displayDescription = description || defaultContent.description

  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-[300px] px-4 text-center',
      className
    )}>
      <div className="mb-4">
        {displayIcon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{displayDescription}</p>
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// 网络错误组件
interface NetworkErrorProps {
  onRetry?: () => void
  className?: string
}

export function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <ErrorState
      variant="network"
      action={onRetry ? { label: '重试', onClick: onRetry } : undefined}
      className={className}
    />
  )
}

// 404组件
interface NotFoundProps {
  title?: string
  description?: string
  showHomeButton?: boolean
  className?: string
}

export function NotFound({ 
  title = '页面不存在', 
  description = '您访问的页面不存在或已被移除',
  showHomeButton = true,
  className 
}: NotFoundProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-[400px] px-4 text-center',
      className
    )}>
      <div className="text-6xl font-bold text-muted-foreground/30 mb-4">404</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {showHomeButton && (
        <Button onClick={() => window.location.href = '/'} variant="default">
          <Home className="h-4 w-4 mr-2" />
          回到首页
        </Button>
      )}
    </div>
  )
}

// 加载失败组件
interface LoadFailedProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export function LoadFailed({ 
  message = '数据加载失败', 
  onRetry, 
  className 
}: LoadFailedProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-8 px-4 text-center',
      className
    )}>
      <AlertTriangle className="h-12 w-12 text-orange-500 mb-3" />
      <p className="text-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          重试
        </Button>
      )}
    </div>
  )
}

// 权限拒绝组件
interface AccessDeniedProps {
  message?: string
  className?: string
}

export function AccessDenied({ 
  message = '您没有权限访问此内容', 
  className 
}: AccessDeniedProps) {
  return (
    <ErrorState
      variant="forbidden"
      title="访问被拒绝"
      description={message}
      className={className}
    />
  )
}