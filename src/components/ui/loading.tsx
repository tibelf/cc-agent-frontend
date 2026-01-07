import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// 基础加载指示器
interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: 'default' | 'primary' | 'secondary'
}

export function Loader({ size = 'md', className, variant = 'default' }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }
  
  const variantClasses = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary'
  }

  return (
    <Loader2 
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )} 
    />
  )
}

// 加载状态包装器
interface LoadingProps {
  loading?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Loading({ 
  loading = false, 
  children, 
  fallback,
  size = 'md',
  className 
}: LoadingProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        {fallback || <Loader size={size} variant="primary" />}
      </div>
    )
  }
  
  return <>{children}</>
}

// 页面级加载组件
interface PageLoadingProps {
  title?: string
  description?: string
  className?: string
}

export function PageLoading({ 
  title = '加载中...', 
  description,
  className 
}: PageLoadingProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-[400px] space-y-4',
      className
    )}>
      <Loader size="xl" variant="primary" />
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}

// 骨架屏组件
interface SkeletonProps {
  className?: string
  variant?: 'rectangle' | 'circle' | 'text'
  width?: string | number
  height?: string | number
  count?: number
}

export function Skeleton({ 
  className, 
  variant = 'rectangle',
  width,
  height,
  count = 1
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-muted rounded'
  
  const variantClasses = {
    rectangle: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4'
  }
  
  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  
  if (count === 1) {
    return (
      <div 
        className={cn(baseClasses, variantClasses[variant], className)}
        style={style}
      />
    )
  }
  
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClasses, variantClasses[variant], className)}
          style={style}
        />
      ))}
    </div>
  )
}

// 卡片骨架屏
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 border rounded-lg space-y-4', className)}>
      <div className="flex items-center space-x-3">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton width="100%" height={12} />
        <Skeleton width="80%" height={12} />
        <Skeleton width="90%" height={12} />
      </div>
      <div className="flex space-x-2 justify-end">
        <Skeleton width={80} height={32} />
        <Skeleton width={80} height={32} />
      </div>
    </div>
  )
}

// 表格骨架屏
interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* 表头 */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} width="100%" height={16} className="flex-1" />
        ))}
      </div>
      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              width="100%" 
              height={12} 
              className="flex-1" 
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// 列表骨架屏
interface ListSkeletonProps {
  items?: number
  showAvatar?: boolean
  showActions?: boolean
  className?: string
}

export function ListSkeleton({ 
  items = 5, 
  showAvatar = true, 
  showActions = false,
  className 
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          {showAvatar && <Skeleton variant="circle" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={12} />
          </div>
          {showActions && (
            <div className="flex space-x-2">
              <Skeleton width={60} height={28} />
              <Skeleton width={60} height={28} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// 按钮加载状态
interface LoadingButtonProps {
  loading?: boolean
  children: React.ReactNode
  loadingText?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost'
  onClick?: () => void
}

export function LoadingButton({
  loading = false,
  children,
  loadingText,
  disabled,
  className,
  size = 'md',
  variant = 'default',
  onClick
}: LoadingButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  const variantClasses = {
    default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}

// 内容加载状态
interface ContentLoadingProps {
  lines?: number
  className?: string
}

export function ContentLoading({ lines = 3, className }: ContentLoadingProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => {
        const width = i === lines - 1 ? '60%' : '100%'
        return (
          <Skeleton 
            key={i} 
            width={width} 
            height={16}
            variant="text"
          />
        )
      })}
    </div>
  )
}

// 图片加载占位符
interface ImagePlaceholderProps {
  width?: string | number
  height?: string | number
  className?: string
  alt?: string
}

export function ImagePlaceholder({ 
  width = '100%', 
  height = 200, 
  className,
  alt = 'Loading...' 
}: ImagePlaceholderProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div 
      className={cn(
        'flex items-center justify-center bg-muted rounded animate-pulse',
        className
      )}
      style={style}
    >
      <span className="text-xs text-muted-foreground">{alt}</span>
    </div>
  )
}

// 导出所有组件
export {
  LoadingButton as Button,
  ContentLoading,
  ImagePlaceholder
}