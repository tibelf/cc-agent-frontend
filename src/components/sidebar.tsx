'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ListTodo, 
  Users, 
  BarChart3, 
  Shield, 
  Settings,
  Activity,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from '@/components/logout-button'

const navigation = [
  {
    name: '概览',
    href: '/',
    icon: LayoutDashboard,
    description: '系统总体状态和关键指标'
  },
  {
    name: '任务管理',
    href: '/tasks',
    icon: ListTodo,
    description: '创建、管理和监控任务'
  },
  {
    name: '任务模版',
    href: '/templates',
    icon: FileText,
    description: '管理任务描述模版'
  },
  {
    name: '工作器',
    href: '/workers',
    icon: Users,
    description: '查看和管理Claude工作器'
  },
  {
    name: '监控',
    href: '/monitoring',
    icon: BarChart3,
    description: '系统性能和告警监控'
  },
  {
    name: '安全',
    href: '/security',
    icon: Shield,
    description: '安全审计和权限管理'
  },
  {
    name: '设置',
    href: '/settings',
    icon: Settings,
    description: '系统配置和参数调整'
  }
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Activity className="h-8 w-8 text-primary" />
          <div className="text-lg font-semibold text-foreground">
            CC-Agent
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
                )}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
                {!isActive && (
                  <div className="text-xs text-muted-foreground mt-0.5 group-hover:text-accent-foreground/80">
                    {item.description}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            CC-Agent v1.0.0
          </div>
          <LogoutButton variant="ghost" showText={false} />
        </div>
      </div>
    </div>
  )
}