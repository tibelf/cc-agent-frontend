'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Shield,
  Key,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Activity,
  Clock,
  Globe,
  Server
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useSecurityReport, useSecurityLogs, useSecurityUsers, useApiKeys } from '@/hooks/use-security'

// 安全审计日志数据类型
interface SecurityLog {
  id: string
  type: 'login' | 'logout' | 'permission_change' | 'api_access' | 'failed_login' | 'system_change'
  user: string
  action: string
  ip_address: string
  user_agent: string
  timestamp: string
  success: boolean
  details?: Record<string, unknown>
}

// 用户权限数据类型
interface UserPermission {
  id: string
  username: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
  permissions: string[]
  last_login: string
  status: 'active' | 'inactive' | 'locked'
  created_at: string
}

// API密钥数据类型
interface ApiKey {
  id: string
  name: string
  key_preview: string
  permissions: string[]
  created_at: string
  last_used: string
  expires_at?: string
  status: 'active' | 'revoked'
}

// 模拟数据
const mockSecurityLogs: SecurityLog[] = [
  {
    id: 'log_001',
    type: 'login',
    user: 'admin',
    action: '用户登录',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    success: true
  },
  {
    id: 'log_002', 
    type: 'failed_login',
    user: 'unknown',
    action: '登录失败',
    ip_address: '203.0.113.45',
    user_agent: 'curl/7.68.0',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    success: false,
    details: { reason: 'Invalid credentials' }
  },
  {
    id: 'log_003',
    type: 'api_access',
    user: 'api_user',
    action: 'API调用: /api/tasks',
    ip_address: '10.0.0.50',
    user_agent: 'Python/3.9 requests/2.25.1',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    success: true
  },
  {
    id: 'log_004',
    type: 'permission_change',
    user: 'admin',
    action: '修改用户权限',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    success: true,
    details: { target_user: 'operator1', changes: ['task_create', 'task_delete'] }
  }
]

const mockUsers: UserPermission[] = [
  {
    id: 'user_001',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['*'],
    last_login: new Date(Date.now() - 300000).toISOString(),
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'user_002',
    username: 'operator1',
    email: 'operator1@example.com', 
    role: 'operator',
    permissions: ['task_read', 'task_create', 'task_update', 'worker_read'],
    last_login: new Date(Date.now() - 3600000).toISOString(),
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 'user_003',
    username: 'viewer1',
    email: 'viewer1@example.com',
    role: 'viewer', 
    permissions: ['task_read', 'worker_read', 'metrics_read'],
    last_login: new Date(Date.now() - 86400000).toISOString(),
    status: 'inactive',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  }
]

const mockApiKeys: ApiKey[] = [
  {
    id: 'key_001',
    name: 'Production API Key',
    key_preview: 'ak_prod_****7f2d',
    permissions: ['task_read', 'task_create', 'worker_read'],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    last_used: new Date(Date.now() - 900000).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 90).toISOString(),
    status: 'active'
  },
  {
    id: 'key_002', 
    name: 'Monitoring Key',
    key_preview: 'ak_mon_****9a1c',
    permissions: ['metrics_read', 'worker_read'],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    last_used: new Date(Date.now() - 3600000).toISOString(),
    status: 'active'
  },
  {
    id: 'key_003',
    name: 'Deprecated Key',
    key_preview: 'ak_old_****3b4e',
    permissions: ['task_read'],
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    last_used: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: 'revoked'
  }
]

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'keys' | 'settings'>('audit')
  const [showNewUserForm, setShowNewUserForm] = useState(false)
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)

  // 使用真实数据 hooks
  const { data: securityReportResponse } = useSecurityReport()
  const { data: securityLogsResponse, isLoading: logsLoading } = useSecurityLogs({ limit: 50 })
  const { data: usersResponse, isLoading: usersLoading } = useSecurityUsers()
  const { data: apiKeysResponse, isLoading: keysLoading } = useApiKeys()
  
  // 使用真实数据或回退到模拟数据
  const securityReport = securityReportResponse?.data
  const securityLogs = securityLogsResponse?.data?.items || mockSecurityLogs
  const users = usersResponse?.data || mockUsers
  const apiKeys = apiKeysResponse?.data || mockApiKeys

  const getLogTypeIcon = (type: SecurityLog['type']) => {
    const icons = {
      login: <UserCheck className="h-4 w-4 text-green-600" />,
      logout: <UserX className="h-4 w-4 text-gray-600" />,
      failed_login: <XCircle className="h-4 w-4 text-red-600" />,
      api_access: <Key className="h-4 w-4 text-blue-600" />,
      permission_change: <Settings className="h-4 w-4 text-orange-600" />,
      system_change: <Server className="h-4 w-4 text-purple-600" />
    }
    return icons[type] || <Activity className="h-4 w-4 text-gray-600" />
  }

  const getLogTypeLabel = (type: SecurityLog['type']) => {
    const labels = {
      login: '用户登录',
      logout: '用户登出',
      failed_login: '登录失败',
      api_access: 'API访问',
      permission_change: '权限变更',
      system_change: '系统变更'
    }
    return labels[type] || type
  }

  const getRoleColor = (role: UserPermission['role']) => {
    const colors = {
      admin: 'text-red-600 bg-red-50',
      operator: 'text-blue-600 bg-blue-50',
      viewer: 'text-green-600 bg-green-50'
    }
    return colors[role] || 'text-gray-600 bg-gray-50'
  }

  const getStatusIcon = (status: UserPermission['status']) => {
    const icons = {
      active: <CheckCircle className="h-4 w-4 text-green-600" />,
      inactive: <Clock className="h-4 w-4 text-yellow-600" />,
      locked: <Lock className="h-4 w-4 text-red-600" />
    }
    return icons[status] || <Activity className="h-4 w-4 text-gray-600" />
  }

  const activeUsers = users.filter(u => u.status === 'active').length
  const failedLogins = securityLogs.filter(log => log.type === 'failed_login').length
  const activeKeys = apiKeys.filter(k => k.status === 'active').length
  
  // 使用真实安全报告数据
  const securityStatus = securityReport?.security_status || 'healthy'
  const blockedTasksCount = securityReport?.blocked_tasks_count || 0

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">安全管理</h1>
          <p className="text-muted-foreground">系统安全审计和权限管理</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            安全检查
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              总共 {users.length} 个用户
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失败登录</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedLogins}</div>
            <p className="text-xs text-muted-foreground">
              过去24小时
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃API密钥</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeKeys}</div>
            <p className="text-xs text-muted-foreground">
              总共 {apiKeys.length} 个密钥
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">安全等级</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              securityStatus === 'healthy' ? 'text-green-600' : 
              securityStatus === 'warning' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {securityStatus === 'healthy' ? '高' : 
               securityStatus === 'warning' ? '中' : '低'}
            </div>
            <p className="text-xs text-muted-foreground">
              {blockedTasksCount > 0 ? `${blockedTasksCount} 个被封锁任务` : '所有检查正常'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { key: 'audit', label: '安全审计', icon: Activity },
            { key: 'users', label: '用户管理', icon: Users },
            { key: 'keys', label: 'API密钥', icon: Key },
            { key: 'settings', label: '安全设置', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as 'audit' | 'users' | 'keys' | 'settings')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>安全审计日志</CardTitle>
            <CardDescription>系统安全事件和访问记录</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
                <span className="text-muted-foreground">加载安全日志...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {securityLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                  <div className="mt-1">
                    {getLogTypeIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={log.success ? 'default' : 'destructive'}>
                          {getLogTypeLabel(log.type)}
                        </Badge>
                        <span className="font-medium">{log.action}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>用户: {log.user}</span>
                      <span className="flex items-center space-x-1">
                        <Globe className="h-3 w-3" />
                        <span>{log.ip_address}</span>
                      </span>
                      {log.details && (
                        <span>详情: {JSON.stringify(log.details)}</span>
                      )}
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">用户权限管理</h3>
              <p className="text-sm text-muted-foreground">管理系统用户和权限分配</p>
            </div>
            <Button onClick={() => setShowNewUserForm(!showNewUserForm)}>
              <Users className="h-4 w-4 mr-2" />
              添加用户
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              {usersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
                  <span className="text-muted-foreground">加载用户数据...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(user.status)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{user.username}</span>
                          <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email} • 最后登录: {formatDateTime(user.last_login)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          权限: {user.permissions.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        编辑
                      </Button>
                      <Button variant="outline" size="sm">
                        {user.status === 'active' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">API密钥管理</h3>
              <p className="text-sm text-muted-foreground">管理API访问密钥和权限</p>
            </div>
            <Button onClick={() => setShowNewKeyForm(!showNewKeyForm)}>
              <Key className="h-4 w-4 mr-2" />
              创建密钥
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              {keysLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
                  <span className="text-muted-foreground">加载API密钥...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Key className={`h-5 w-5 ${key.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{key.name}</span>
                          <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                            {key.status === 'active' ? '活跃' : '已撤销'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {key.key_preview} • 最后使用: {formatDateTime(key.last_used)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          权限: {key.permissions.join(', ')}
                          {key.expires_at && ` • 过期: ${formatDateTime(key.expires_at)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        编辑
                      </Button>
                      <Button variant="destructive" size="sm">
                        撤销
                      </Button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>密码策略</CardTitle>
              <CardDescription>配置用户密码要求</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">最小长度</label>
                <Input type="number" defaultValue="8" className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">需要大写字母</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">需要特殊字符</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">密码过期天数</label>
                <Input type="number" defaultValue="90" className="w-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>会话管理</CardTitle>
              <CardDescription>配置用户会话策略</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">会话超时（分钟）</label>
                <Input type="number" defaultValue="30" className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">最大并发会话</label>
                <Input type="number" defaultValue="3" className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">启用双因素认证</label>
                <input type="checkbox" className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">记住登录状态</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IP访问控制</CardTitle>
              <CardDescription>配置IP白名单和黑名单</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">白名单IP</label>
                <textarea 
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                  rows={3}
                  placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                />
              </div>
              <div>
                <label className="text-sm font-medium">黑名单IP</label>
                <textarea 
                  className="w-full mt-1 p-2 border rounded-md text-sm"
                  rows={3}
                  placeholder="203.0.113.0/24"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>审计设置</CardTitle>
              <CardDescription>配置安全审计选项</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">记录登录事件</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">记录API访问</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">记录权限变更</label>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">日志保留天数</label>
                <Input type="number" defaultValue="90" className="w-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}