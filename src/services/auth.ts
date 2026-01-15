import { LoginCredentials, LoginResponse } from '@/types/auth'

class AuthService {
  private static readonly TOKEN_KEY = 'auth_token'

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    const response = await fetch(`${basePath}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (data.success && data.token) {
      this.setToken(data.token)
      // 同时设置 cookie 供 middleware 使用
      this.setCookie(data.token)
    }

    return data
  }

  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY)
      this.clearCookie()
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
      window.location.href = `${basePath}/login`
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY)
    }
    return null
  }

  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token)
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getToken()
    if (!token) return false

    // 客户端检查 JWT 是否过期
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }

  private static setCookie(token: string): void {
    if (typeof window !== 'undefined') {
      // 24 小时过期
      const maxAge = 24 * 60 * 60
      document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; samesite=strict`
    }
  }

  private static clearCookie(): void {
    if (typeof window !== 'undefined') {
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }
}

export default AuthService
