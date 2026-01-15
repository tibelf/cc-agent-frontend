export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token?: string
  message?: string
  user?: {
    username: string
  }
}

export interface AuthUser {
  username: string
}

export interface JWTPayload {
  username: string
  iat: number
  exp: number
}
