import fs from 'fs'
import path from 'path'

interface User {
  username: string
  passwordHash: string
}

interface AuthConfig {
  users: User[]
}

let cachedConfig: AuthConfig | null = null

export function getAuthConfig(): AuthConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const configPath = path.join(process.cwd(), 'config', 'auth.json')

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8')
    cachedConfig = JSON.parse(configContent) as AuthConfig
    return cachedConfig
  } catch (error) {
    console.error('Failed to load auth config:', error)
    throw new Error('Auth configuration not found. Please create config/auth.json')
  }
}

export function findUser(username: string): User | undefined {
  const config = getAuthConfig()
  return config.users.find((u) => u.username === username)
}

// 清除缓存（用于热重载）
export function clearAuthConfigCache(): void {
  cachedConfig = null
}
