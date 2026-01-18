import { TaskTemplate, CreateTemplateRequest, UpdateTemplateRequest, ApplyTemplateRequest } from '@/types'

// 获取 basePath，在 Next.js 中需要手动处理
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const API_BASE = `${basePath}/api/templates`

// 获取所有模版
export async function getTemplates(): Promise<TaskTemplate[]> {
  const response = await fetch(API_BASE)
  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || '获取模版失败')
  }

  return result.data
}

// 创建新模版
export async function createTemplate(request: CreateTemplateRequest): Promise<TaskTemplate> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || '创建模版失败')
  }

  return result.data
}

// 更新模版
export async function updateTemplate(request: UpdateTemplateRequest): Promise<TaskTemplate> {
  const response = await fetch(`${API_BASE}/${request.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || '更新模版失败')
  }

  return result.data
}

// 删除模版
export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE'
  })
  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || '删除模版失败')
  }
}

// 获取单个模版
export async function getTemplate(id: string): Promise<TaskTemplate> {
  const response = await fetch(`${API_BASE}/${id}`)
  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || '获取模版失败')
  }

  return result.data
}

// 应用模版，渲染变量
export async function applyTemplate(request: ApplyTemplateRequest): Promise<string> {
  const response = await fetch(`${API_BASE}/${request.template_id}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variables: request.variables })
  })
  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || '应用模版失败')
  }

  return result.data.rendered
}

// 提取模版中的变量（客户端工具函数）
export function extractVariables(template: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g
  const variables: string[] = []
  let match

  while ((match = variableRegex.exec(template)) !== null) {
    const varName = match[1].trim()
    if (!variables.includes(varName)) {
      variables.push(varName)
    }
  }

  return variables
}

// 验证模版格式（客户端工具函数）
export function validateTemplate(template: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查是否有未闭合的变量占位符
  const openBraces = (template.match(/\{\{/g) || []).length
  const closeBraces = (template.match(/\}\}/g) || []).length

  if (openBraces !== closeBraces) {
    errors.push('模版中存在未闭合的变量占位符')
  }

  // 检查变量名是否有效
  const variables = extractVariables(template)
  for (const variable of variables) {
    if (!variable.trim()) {
      errors.push('存在空的变量名')
    }
    if (variable.includes(' ')) {
      errors.push(`变量名不能包含空格: "${variable}"`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
