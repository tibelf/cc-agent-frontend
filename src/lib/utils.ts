import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format } from "date-fns"
import { zhCN } from "date-fns/locale/zh-CN"

/**
 * 合并 Tailwind 类名的工具函数
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateString: string) {
  return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss')
}

/**
 * 将UTC时间转换为北京时间 (GMT+8)
 */
export function utcToBeijingTime(utcDateString: string): Date {
  const utcDate = new Date(utcDateString)
  // 北京时间是UTC+8，增加8小时
  return new Date(utcDate.getTime() + 8 * 60 * 60 * 1000)
}

/**
 * 格式化北京时间
 */
export function formatBeijingDateTime(utcDateString: string) {
  const beijingTime = utcToBeijingTime(utcDateString)
  return format(beijingTime, 'yyyy-MM-dd HH:mm:ss') + ' (北京时间)'
}

/**
 * 格式化北京时间（简化版，不显示时区标识）
 */
export function formatBeijingDateTimeSimple(utcDateString: string) {
  const beijingTime = utcToBeijingTime(utcDateString)
  return format(beijingTime, 'yyyy-MM-dd HH:mm:ss')
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(dateString: string) {
  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale: zhCN
  })
}

/**
 * 格式化持续时间（秒）
 */
export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, precision: number = 1) {
  return `${value.toFixed(precision)}%`
}

/**
 * 获取任务状态颜色
 */
export function getTaskStateColor(state: string) {
  const colors = {
    pending: 'text-yellow-600 bg-yellow-50',
    processing: 'text-blue-600 bg-blue-50',
    paused: 'text-orange-600 bg-orange-50',
    waiting_unban: 'text-purple-600 bg-purple-50',
    retrying: 'text-indigo-600 bg-indigo-50',
    completed: 'text-green-600 bg-green-50',
    failed: 'text-red-600 bg-red-50',
    needs_human_review: 'text-pink-600 bg-pink-50',
    awaiting_confirmation: 'text-teal-600 bg-teal-50',
  }
  return colors[state as keyof typeof colors] || 'text-gray-600 bg-gray-50'
}

/**
 * 获取优先级颜色
 */
export function getPriorityColor(priority: string) {
  const colors = {
    low: 'text-gray-600 bg-gray-50',
    normal: 'text-blue-600 bg-blue-50',
    high: 'text-orange-600 bg-orange-50',
    urgent: 'text-red-600 bg-red-50',
  }
  return colors[priority as keyof typeof colors] || 'text-gray-600 bg-gray-50'
}

/**
 * 获取系统状态颜色
 */
export function getSystemStatusColor(status: string) {
  const colors = {
    healthy: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    critical: 'text-red-600 bg-red-50',
  }
  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50'
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number = 50) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * 生成随机ID
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * 延迟函数
 */
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // 备用方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}