'use client'

import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AuthService from '@/services/auth'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  showText?: boolean
}

export function LogoutButton({
  variant = 'ghost',
  showText = true,
}: LogoutButtonProps) {
  const handleLogout = () => {
    AuthService.logout()
  }

  return (
    <Button
      variant={variant}
      size={showText ? 'default' : 'icon'}
      onClick={handleLogout}
      className="text-muted-foreground hover:text-foreground"
      title="退出登录"
    >
      <LogOut className="h-4 w-4" />
      {showText && <span className="ml-2">退出</span>}
    </Button>
  )
}
