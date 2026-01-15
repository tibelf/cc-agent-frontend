import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '登录 - CC-Agent',
  description: '登录 CC-Agent 任务管理系统',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 登录页面使用独立布局，不显示侧边栏
  return <>{children}</>
}
