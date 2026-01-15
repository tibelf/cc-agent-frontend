import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { findUser } from '@/lib/auth-config'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    // 从配置文件获取用户
    const user = findUser(username)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 获取 JWT 配置（从环境变量）
    const jwtSecret = process.env.AUTH_JWT_SECRET
    if (!jwtSecret) {
      console.error('AUTH_JWT_SECRET not configured')
      return NextResponse.json(
        { success: false, message: '服务器配置错误' },
        { status: 500 }
      )
    }

    const secret = new TextEncoder().encode(jwtSecret)
    const expiresIn = process.env.AUTH_TOKEN_EXPIRY || '24h'

    // 生成 JWT token
    const token = await new SignJWT({ username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret)

    return NextResponse.json({
      success: true,
      token,
      user: { username },
      message: '登录成功',
    })
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
