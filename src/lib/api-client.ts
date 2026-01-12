import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add request timestamp for logging
        config.metadata = { startTime: Date.now() }
        
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response time
        const endTime = Date.now()
        const startTime = response.config.metadata?.startTime || endTime
        console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${endTime - startTime}ms`)
        
        return response
      },
      (error) => {
        if (error.response) {
          // Server responded with error status
          console.error('API Error:', error.response.status, error.response.data)
          
          // Handle common error cases
          switch (error.response.status) {
            case 401:
              this.handleUnauthorized()
              break
            case 403:
              console.error('Access forbidden')
              break
            case 404:
              console.error('Resource not found')
              break
            case 500:
              console.error('Server error')
              break
          }
        } else if (error.request) {
          // Network error
          console.error('Network Error:', error.message)
        } else {
          console.error('Request Error:', error.message)
        }
        
        return Promise.reject(error)
      }
    )
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  private handleUnauthorized() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      // Redirect to login page if needed
      // window.location.href = '/login'
    }
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return response.data
  }

  async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  // Raw axios client for special cases
  getRawClient(): AxiosInstance {
    return this.client
  }
}

// Extend the AxiosRequestConfig interface to include our custom metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

export const apiClient = new ApiClient()
export default apiClient