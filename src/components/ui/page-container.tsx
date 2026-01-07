'use client'

import React from 'react'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function PageContainer({
  children,
  className = '',
  maxWidth = 'full',
  padding = 'md'
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div className={`
      flex-1 
      ${paddingClasses[padding]}
      ${className}
    `}>
      <div className={`
        w-full 
        ${maxWidthClasses[maxWidth]} 
        mx-auto 
        space-y-6
      `}>
        {children}
      </div>
    </div>
  )
}