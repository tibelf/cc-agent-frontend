import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// 不需要认证的路径（不包含 basePath）
const publicPaths = ['/login', '/api/auth/login']

// basePath 需要硬编码，因为 middleware 运行在 Edge Runtime
// 必须与 next.config.ts 中的 basePath 保持一致
const basePath = '/cc'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('[Middleware] Request pathname:', pathname)
  console.log('[Middleware] Full URL:', request.url)

  // Next.js 在有 basePath 配置时，middleware 收到的 pathname 不包含 basePath
  // 所以直接使用 pathname 进行匹配

  // 允许公开路径
  if (publicPaths.some((path) => pathname === path || pathname.startsWith(path + '/'))) {
    console.log('[Middleware] Public path, allowing access')
    return NextResponse.next()
  }

  // 允许静态资源和 Next.js 内部路径
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 从 cookie 获取 token
  const token = request.cookies.get('auth_token')?.value
  console.log('[Middleware] Token exists:', !!token)

  if (!token) {
    console.log('[Middleware] No token, redirecting to login')
    // 重定向到登录页，需要手动添加 basePath
    const loginUrl = new URL(`${basePath}/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    console.log('[Middleware] Redirect URL:', loginUrl.toString())
    return NextResponse.redirect(loginUrl)
  }

  // 验证 JWT token
  try {
    const jwtSecret = process.env.AUTH_JWT_SECRET
    if (!jwtSecret) {
      console.error('AUTH_JWT_SECRET not configured')
      throw new Error('JWT secret not configured')
    }

    const secret = new TextEncoder().encode(jwtSecret)
    await jwtVerify(token, secret)

    return NextResponse.next()
  } catch (error) {
    console.error('JWT verification failed:', error)
    // token 无效，清除并重定向到登录页
    const response = NextResponse.redirect(
      new URL(`${basePath}/login`, request.url)
    )
    response.cookies.delete('auth_token')
    return response
  }
}

export const config = {
  /*
   * 匹配所有路径，除了静态资源
   * 注意：当配置了 basePath 时，matcher 不需要包含 basePath
   */
  matcher: [
    /*
     * 匹配:
     * - / (首页)
     * - /tasks, /workers, /monitoring 等页面
     * - /api/* (API 路由)
     * 不匹配:
     * - /_next/* (Next.js 内部)
     * - /favicon.ico
     * - 带文件扩展名的路径
     */
    '/',
    '/tasks/:path*',
    '/templates/:path*',
    '/workers/:path*',
    '/monitoring/:path*',
    '/security/:path*',
    '/settings/:path*',
    '/login/:path*',
    '/api/:path*',
  ],
}
