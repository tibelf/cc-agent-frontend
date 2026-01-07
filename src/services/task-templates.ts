import { TaskTemplate, CreateTemplateRequest, UpdateTemplateRequest, ApplyTemplateRequest } from '@/types'

const STORAGE_KEY = 'task_templates'

// 获取所有模版
export function getTemplates(): TaskTemplate[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading templates from localStorage:', error)
    return []
  }
}

// 保存模版到本地存储
function saveTemplates(templates: TaskTemplate[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch (error) {
    console.error('Error saving templates to localStorage:', error)
  }
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 创建新模版
export function createTemplate(request: CreateTemplateRequest): TaskTemplate {
  const templates = getTemplates()
  
  const newTemplate: TaskTemplate = {
    id: generateId(),
    name: request.name,
    description: request.description,
    prompt_template: request.prompt_template,
    variables: request.variables,
    created_at: new Date().toISOString(),
    usage_count: 0
  }
  
  templates.push(newTemplate)
  saveTemplates(templates)
  
  return newTemplate
}

// 更新模版
export function updateTemplate(request: UpdateTemplateRequest): TaskTemplate | null {
  const templates = getTemplates()
  const index = templates.findIndex(t => t.id === request.id)
  
  if (index === -1) return null
  
  const updatedTemplate: TaskTemplate = {
    ...templates[index],
    ...request,
    id: request.id // 确保ID不被覆盖
  }
  
  templates[index] = updatedTemplate
  saveTemplates(templates)
  
  return updatedTemplate
}

// 删除模版
export function deleteTemplate(id: string): boolean {
  const templates = getTemplates()
  const filteredTemplates = templates.filter(t => t.id !== id)
  
  if (filteredTemplates.length === templates.length) {
    return false // 模版不存在
  }
  
  saveTemplates(filteredTemplates)
  return true
}

// 获取单个模版
export function getTemplate(id: string): TaskTemplate | null {
  const templates = getTemplates()
  return templates.find(t => t.id === id) || null
}

// 应用模版，渲染变量
export function applyTemplate(request: ApplyTemplateRequest): string {
  const template = getTemplate(request.template_id)
  if (!template) {
    throw new Error('Template not found')
  }
  
  // 增加使用次数
  updateTemplate({
    id: template.id,
    usage_count: template.usage_count + 1
  })
  
  // 渲染模版
  let renderedTemplate = template.prompt_template
  
  // 替换变量占位符
  for (const [varName, varValue] of Object.entries(request.variables)) {
    const placeholder = `{{${varName}}}`
    renderedTemplate = renderedTemplate.replace(new RegExp(placeholder, 'g'), varValue)
  }
  
  return renderedTemplate
}

// 提取模版中的变量
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

// 验证模版格式
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