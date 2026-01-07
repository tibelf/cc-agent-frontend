import React, { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

// 基础动画配置
export type AnimationType = 
  | 'fadeIn' | 'fadeOut' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight'
  | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
  | 'scaleIn' | 'scaleOut' | 'bounce' | 'shake' | 'pulse' | 'flip'

export type AnimationDuration = 'fast' | 'normal' | 'slow' | number

export type AnimationEasing = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'

// 动画包装组件
interface AnimatedProps {
  children: React.ReactNode
  animation: AnimationType
  duration?: AnimationDuration
  delay?: number
  easing?: AnimationEasing
  loop?: boolean
  trigger?: 'mount' | 'hover' | 'click' | 'visibility'
  className?: string
  style?: React.CSSProperties
}

export function Animated({
  children,
  animation,
  duration = 'normal',
  delay = 0,
  easing = 'ease',
  loop = false,
  trigger = 'mount',
  className,
  style
}: AnimatedProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  // 获取动画持续时间
  const getDuration = () => {
    switch (duration) {
      case 'fast': return 200
      case 'normal': return 300
      case 'slow': return 500
      default: return typeof duration === 'number' ? duration : 300
    }
  }

  // 获取动画类名
  const getAnimationClass = () => {
    const baseClasses = 'transition-all'
    const durationMs = getDuration()
    const durationClass = `duration-[${durationMs}ms]`
    const easingClass = `ease-${easing}`
    const delayClass = delay > 0 ? `delay-[${delay}ms]` : ''

    return cn(baseClasses, durationClass, easingClass, delayClass, {
      'animate-pulse': loop && animation === 'pulse',
      'animate-bounce': loop && animation === 'bounce',
    })
  }

  // 获取动画样式
  const getAnimationStyles = () => {
    if (!isAnimating && trigger === 'visibility' && !isVisible) {
      return getInitialStyles()
    }

    if (!isAnimating && trigger !== 'mount') {
      return {}
    }

    return getActiveStyles()
  }

  // 获取初始状态样式
  const getInitialStyles = (): React.CSSProperties => {
    switch (animation) {
      case 'fadeIn':
      case 'fadeOut':
        return { opacity: 0 }
      case 'fadeInUp':
        return { opacity: 0, transform: 'translateY(20px)' }
      case 'fadeInDown':
        return { opacity: 0, transform: 'translateY(-20px)' }
      case 'fadeInLeft':
        return { opacity: 0, transform: 'translateX(-20px)' }
      case 'fadeInRight':
        return { opacity: 0, transform: 'translateX(20px)' }
      case 'slideUp':
        return { transform: 'translateY(100%)' }
      case 'slideDown':
        return { transform: 'translateY(-100%)' }
      case 'slideLeft':
        return { transform: 'translateX(100%)' }
      case 'slideRight':
        return { transform: 'translateX(-100%)' }
      case 'scaleIn':
        return { transform: 'scale(0)' }
      case 'scaleOut':
        return { transform: 'scale(1)' }
      default:
        return {}
    }
  }

  // 获取激活状态样式
  const getActiveStyles = (): React.CSSProperties => {
    switch (animation) {
      case 'fadeIn':
        return { opacity: 1 }
      case 'fadeOut':
        return { opacity: 0 }
      case 'fadeInUp':
      case 'fadeInDown':
      case 'fadeInLeft':
      case 'fadeInRight':
        return { opacity: 1, transform: 'translate(0, 0)' }
      case 'slideUp':
      case 'slideDown':
      case 'slideLeft':
      case 'slideRight':
        return { transform: 'translate(0, 0)' }
      case 'scaleIn':
        return { transform: 'scale(1)' }
      case 'scaleOut':
        return { transform: 'scale(0)' }
      case 'shake':
        return { 
          animation: `shake ${getDuration()}ms ${easing}`,
          animationIterationCount: loop ? 'infinite' : 1
        }
      case 'flip':
        return { 
          animation: `flip ${getDuration()}ms ${easing}`,
          animationIterationCount: loop ? 'infinite' : 1
        }
      default:
        return {}
    }
  }

  // 处理可见性触发
  useEffect(() => {
    if (trigger === 'visibility' && elementRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(entry.isIntersecting)
          if (entry.isIntersecting) {
            setIsAnimating(true)
          }
        },
        { threshold: 0.1 }
      )

      observer.observe(elementRef.current)
      return () => observer.disconnect()
    }
  }, [trigger])

  // 处理挂载触发
  useEffect(() => {
    if (trigger === 'mount') {
      const timer = setTimeout(() => {
        setIsAnimating(true)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [trigger, delay])

  // 事件处理器
  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsAnimating(true)
    }
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsAnimating(false)
    }
  }

  const handleClick = () => {
    if (trigger === 'click') {
      setIsAnimating(!isAnimating)
    }
  }

  return (
    <div
      ref={elementRef}
      className={cn(getAnimationClass(), className)}
      style={{
        ...getAnimationStyles(),
        ...style
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

// 淡入动画
export function FadeIn({ 
  children, 
  duration = 'normal', 
  delay = 0, 
  className 
}: {
  children: React.ReactNode
  duration?: AnimationDuration
  delay?: number
  className?: string
}) {
  return (
    <Animated 
      animation="fadeIn" 
      duration={duration} 
      delay={delay} 
      className={className}
    >
      {children}
    </Animated>
  )
}

// 从下方滑入
export function SlideInUp({ 
  children, 
  duration = 'normal', 
  delay = 0, 
  className 
}: {
  children: React.ReactNode
  duration?: AnimationDuration
  delay?: number
  className?: string
}) {
  return (
    <Animated 
      animation="fadeInUp" 
      duration={duration} 
      delay={delay} 
      className={className}
    >
      {children}
    </Animated>
  )
}

// 缩放进入动画
export function ScaleIn({ 
  children, 
  duration = 'normal', 
  delay = 0, 
  className 
}: {
  children: React.ReactNode
  duration?: AnimationDuration
  delay?: number
  className?: string
}) {
  return (
    <Animated 
      animation="scaleIn" 
      duration={duration} 
      delay={delay} 
      className={className}
    >
      {children}
    </Animated>
  )
}

// 可见性触发的动画
export function AnimateOnScroll({ 
  children, 
  animation = 'fadeInUp',
  duration = 'normal',
  className 
}: {
  children: React.ReactNode
  animation?: AnimationType
  duration?: AnimationDuration
  className?: string
}) {
  return (
    <Animated 
      animation={animation} 
      duration={duration} 
      trigger="visibility"
      className={className}
    >
      {children}
    </Animated>
  )
}

// 交错动画组件
interface StaggeredAnimationProps {
  children: React.ReactNode[]
  animation?: AnimationType
  duration?: AnimationDuration
  staggerDelay?: number
  className?: string
}

export function StaggeredAnimation({
  children,
  animation = 'fadeInUp',
  duration = 'normal',
  staggerDelay = 100,
  className
}: StaggeredAnimationProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <Animated
          key={index}
          animation={animation}
          duration={duration}
          delay={index * staggerDelay}
        >
          {child}
        </Animated>
      ))}
    </div>
  )
}

// 悬停动画包装器
export function HoverAnimation({
  children,
  animation = 'scaleIn',
  duration = 'fast',
  className
}: {
  children: React.ReactNode
  animation?: AnimationType
  duration?: AnimationDuration
  className?: string
}) {
  return (
    <Animated
      animation={animation}
      duration={duration}
      trigger="hover"
      className={className}
    >
      {children}
    </Animated>
  )
}

// 页面过渡组件
interface PageTransitionProps {
  children: React.ReactNode
  isVisible: boolean
  animation?: 'fade' | 'slide' | 'scale'
  duration?: AnimationDuration
  className?: string
}

export function PageTransition({
  children,
  isVisible,
  animation = 'fade',
  duration = 'normal',
  className
}: PageTransitionProps) {
  const getAnimation = (): AnimationType => {
    switch (animation) {
      case 'slide':
        return 'slideRight'
      case 'scale':
        return 'scaleIn'
      default:
        return 'fadeIn'
    }
  }

  return (
    <div className={cn(
      'transition-all',
      duration === 'fast' ? 'duration-200' :
      duration === 'slow' ? 'duration-500' : 'duration-300',
      isVisible ? 'opacity-100' : 'opacity-0',
      className
    )}>
      {isVisible && (
        <Animated animation={getAnimation()} duration={duration}>
          {children}
        </Animated>
      )}
    </div>
  )
}

// 加载动画
export function LoadingDots({ 
  size = 'md',
  color = 'primary' 
}: {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'muted'
}) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    muted: 'bg-muted-foreground'
  }

  return (
    <div className="flex space-x-1 items-center justify-center">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

// 脉冲动画
export function Pulse({ 
  children,
  intensity = 'normal',
  className 
}: {
  children: React.ReactNode
  intensity?: 'light' | 'normal' | 'strong'
  className?: string
}) {
  const intensityClasses = {
    light: 'animate-pulse opacity-75',
    normal: 'animate-pulse',
    strong: 'animate-pulse opacity-50'
  }

  return (
    <div className={cn(intensityClasses[intensity], className)}>
      {children}
    </div>
  )
}

// 弹跳动画
export function Bounce({ 
  children,
  className 
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('animate-bounce', className)}>
      {children}
    </div>
  )
}

// 旋转动画
export function Spin({ 
  children,
  speed = 'normal',
  className 
}: {
  children: React.ReactNode
  speed?: 'slow' | 'normal' | 'fast'
  className?: string
}) {
  const speedClasses = {
    slow: 'animate-spin [animation-duration:3s]',
    normal: 'animate-spin',
    fast: 'animate-spin [animation-duration:0.5s]'
  }

  return (
    <div className={cn(speedClasses[speed], className)}>
      {children}
    </div>
  )
}

// 摇摆动画
export function Wiggle({ 
  children,
  className 
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div 
      className={cn(
        'hover:animate-pulse transform hover:scale-105 transition-transform duration-200',
        className
      )}
    >
      {children}
    </div>
  )
}

// 自定义CSS动画样式
export const animationStyles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  @keyframes flip {
    0% { transform: perspective(400px) rotateY(0); }
    40% { transform: perspective(400px) rotateY(-180deg); }
    60% { transform: perspective(400px) rotateY(-180deg); }
    100% { transform: perspective(400px) rotateY(0); }
  }

  @keyframes slideInFromTop {
    0% { transform: translateY(-100%); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideInFromBottom {
    0% { transform: translateY(100%); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideInFromLeft {
    0% { transform: translateX(-100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideInFromRight {
    0% { transform: translateX(100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }

  .animate-flip {
    animation: flip 0.6s ease-in-out;
  }

  .animate-slide-in-top {
    animation: slideInFromTop 0.3s ease-out;
  }

  .animate-slide-in-bottom {
    animation: slideInFromBottom 0.3s ease-out;
  }

  .animate-slide-in-left {
    animation: slideInFromLeft 0.3s ease-out;
  }

  .animate-slide-in-right {
    animation: slideInFromRight 0.3s ease-out;
  }
`