import React, { useEffect, useState, useRef, createContext, useContext } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// 模态框上下文
interface ModalContextType {
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

// 模态框Hook
export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a Modal')
  }
  return context
}

// 基础模态框组件
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  overlayClassName?: string
  preventScroll?: boolean
}

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
  preventScroll = true
}: ModalProps) {
  const [isVisible, setIsVisible] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // 处理模态框打开/关闭动画
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      if (preventScroll) {
        document.body.style.overflow = 'hidden'
      }
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      document.body.style.overflow = 'unset'
      return () => clearTimeout(timer)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, preventScroll])

  // ESC键关闭
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // 焦点管理
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstFocusable = focusableElements[0] as HTMLElement
      firstFocusable?.focus()
    }
  }, [isOpen])

  if (!isVisible) return null

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm'
      case 'md':
        return 'max-w-md'
      case 'lg':
        return 'max-w-lg'
      case 'xl':
        return 'max-w-2xl'
      case 'full':
        return 'max-w-full mx-4 my-4 h-full'
      default:
        return 'max-w-md'
    }
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <ModalContext.Provider value={{ closeModal: onClose }}>
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-black bg-opacity-50 backdrop-blur-sm',
          'transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0',
          overlayClassName
        )}
        onClick={handleOverlayClick}
      >
        <div
          ref={modalRef}
          className={cn(
            'relative w-full bg-background rounded-lg shadow-xl',
            'transform transition-all duration-300',
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
            getSizeClasses(),
            size !== 'full' && 'mx-4 my-8 max-h-[90vh] overflow-auto',
            className
          )}
        >
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted z-10"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  )
}

// 模态框头部
interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-border', className)}>
      {children}
    </div>
  )
}

// 模态框标题
interface ModalTitleProps {
  children: React.ReactNode
  className?: string
}

export function ModalTitle({ children, className }: ModalTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-foreground pr-8', className)}>
      {children}
    </h2>
  )
}

// 模态框内容
interface ModalContentProps {
  children: React.ReactNode
  className?: string
}

export function ModalContent({ children, className }: ModalContentProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  )
}

// 模态框底部
interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-border flex justify-end space-x-2', className)}>
      {children}
    </div>
  )
}

// 确认对话框
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  loading = false
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    if (!loading) {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <p className="text-muted-foreground">{message}</p>
      </ModalContent>
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button 
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? '处理中...' : confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// 警告对话框
interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  buttonText?: string
  variant?: 'info' | 'warning' | 'error' | 'success'
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  buttonText = '确定',
  variant = 'info'
}: AlertDialogProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return 'text-orange-600'
      case 'error':
        return 'text-red-600'
      case 'success':
        return 'text-green-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <ModalTitle className={getVariantClasses()}>{title}</ModalTitle>
      </ModalHeader>
      <ModalContent>
        <p className="text-muted-foreground">{message}</p>
      </ModalContent>
      <ModalFooter>
        <Button onClick={onClose}>
          {buttonText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// 抽屉组件
interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  side?: 'left' | 'right' | 'top' | 'bottom'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  overlayClassName?: string
}

export function Drawer({
  isOpen,
  onClose,
  children,
  side = 'right',
  size = 'md',
  className,
  overlayClassName
}: DrawerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      document.body.style.overflow = 'unset'
      return () => clearTimeout(timer)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isVisible) return null

  const getSizeClasses = () => {
    const isHorizontal = side === 'left' || side === 'right'
    
    if (isHorizontal) {
      switch (size) {
        case 'sm': return 'w-80'
        case 'md': return 'w-96'
        case 'lg': return 'w-[600px]'
        default: return 'w-96'
      }
    } else {
      switch (size) {
        case 'sm': return 'h-80'
        case 'md': return 'h-96'
        case 'lg': return 'h-[600px]'
        default: return 'h-96'
      }
    }
  }

  const getPositionClasses = () => {
    switch (side) {
      case 'left':
        return 'left-0 top-0 h-full'
      case 'right':
        return 'right-0 top-0 h-full'
      case 'top':
        return 'top-0 left-0 w-full'
      case 'bottom':
        return 'bottom-0 left-0 w-full'
      default:
        return 'right-0 top-0 h-full'
    }
  }

  const getTransformClasses = () => {
    const baseTransform = 'transform transition-transform duration-300 ease-in-out'
    
    if (!isOpen) {
      switch (side) {
        case 'left':
          return `${baseTransform} -translate-x-full`
        case 'right':
          return `${baseTransform} translate-x-full`
        case 'top':
          return `${baseTransform} -translate-y-full`
        case 'bottom':
          return `${baseTransform} translate-y-full`
        default:
          return `${baseTransform} translate-x-full`
      }
    }
    
    return `${baseTransform} translate-x-0 translate-y-0`
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm',
        'transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0',
        overlayClassName
      )}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'fixed bg-background shadow-xl',
          getPositionClasses(),
          getSizeClasses(),
          getTransformClasses(),
          className
        )}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-full overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

// 抽屉头部
export function DrawerHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn('px-6 py-4 border-b border-border pr-16', className)}>
      {children}
    </div>
  )
}

// 抽屉标题
export function DrawerTitle({ children, className }: ModalTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-foreground', className)}>
      {children}
    </h2>
  )
}

// 抽屉内容
export function DrawerContent({ children, className }: ModalContentProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  )
}

// 抽屉底部
export function DrawerFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('px-6 py-4 border-t border-border flex justify-end space-x-2', className)}>
      {children}
    </div>
  )
}

// 模态框管理器（用于全局模态框状态管理）
interface ModalState {
  id: string
  component: React.ComponentType<any>
  props: any
}

class ModalManager {
  private listeners: Set<(modals: ModalState[]) => void> = new Set()
  private modals: ModalState[] = []

  subscribe(listener: (modals: ModalState[]) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit() {
    this.listeners.forEach(listener => listener([...this.modals]))
  }

  open(component: React.ComponentType<any>, props: any = {}) {
    const id = Math.random().toString(36).substr(2, 9)
    this.modals.push({ id, component, props })
    this.emit()
    return id
  }

  close(id: string) {
    this.modals = this.modals.filter(modal => modal.id !== id)
    this.emit()
  }

  closeAll() {
    this.modals = []
    this.emit()
  }

  confirm(options: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'default' | 'destructive'
  }) {
    return new Promise<boolean>((resolve) => {
      const id = this.open(ConfirmDialog, {
        ...options,
        isOpen: true,
        onClose: () => {
          this.close(id)
          resolve(false)
        },
        onConfirm: () => {
          this.close(id)
          resolve(true)
        }
      })
    })
  }

  alert(options: {
    title: string
    message: string
    buttonText?: string
    variant?: 'info' | 'warning' | 'error' | 'success'
  }) {
    return new Promise<void>((resolve) => {
      const id = this.open(AlertDialog, {
        ...options,
        isOpen: true,
        onClose: () => {
          this.close(id)
          resolve()
        }
      })
    })
  }
}

export const modalManager = new ModalManager()

// Modal Provider组件
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<ModalState[]>([])

  useEffect(() => {
    const unsubscribe = modalManager.subscribe(setModals)
    return unsubscribe
  }, [])

  return (
    <>
      {children}
      {modals.map(({ id, component: Component, props }) => (
        <Component key={id} {...props} />
      ))}
    </>
  )
}

// 简化的模态框Hook
export function useModalManager() {
  return {
    open: modalManager.open.bind(modalManager),
    close: modalManager.close.bind(modalManager),
    closeAll: modalManager.closeAll.bind(modalManager),
    confirm: modalManager.confirm.bind(modalManager),
    alert: modalManager.alert.bind(modalManager)
  }
}