import { useState, useEffect } from 'react'
import { 
  TaskTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest, 
  ApplyTemplateRequest 
} from '@/types'
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplate,
  applyTemplate,
  extractVariables,
  validateTemplate
} from '@/services/task-templates'

export function useTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载模版列表
  const loadTemplates = () => {
    setIsLoading(true)
    try {
      const allTemplates = getTemplates()
      setTemplates(allTemplates)
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始化时加载模版
  useEffect(() => {
    loadTemplates()
  }, [])

  // 创建模版
  const create = (request: CreateTemplateRequest): TaskTemplate => {
    const newTemplate = createTemplate(request)
    setTemplates(prev => [...prev, newTemplate])
    return newTemplate
  }

  // 更新模版
  const update = (request: UpdateTemplateRequest): TaskTemplate | null => {
    const updatedTemplate = updateTemplate(request)
    if (updatedTemplate) {
      setTemplates(prev => 
        prev.map(template => 
          template.id === request.id ? updatedTemplate : template
        )
      )
    }
    return updatedTemplate
  }

  // 删除模版
  const remove = (id: string): boolean => {
    const success = deleteTemplate(id)
    if (success) {
      setTemplates(prev => prev.filter(template => template.id !== id))
    }
    return success
  }

  // 获取单个模版
  const getById = (id: string): TaskTemplate | null => {
    return templates.find(template => template.id === id) || null
  }

  // 应用模版
  const apply = (request: ApplyTemplateRequest): string => {
    const renderedTemplate = applyTemplate(request)
    // 重新加载模版以更新使用次数
    loadTemplates()
    return renderedTemplate
  }

  return {
    templates,
    isLoading,
    create,
    update,
    remove,
    getById,
    apply,
    reload: loadTemplates,
    extractVariables,
    validateTemplate
  }
}

// 单独的Hook用于获取单个模版
export function useTaskTemplate(id: string) {
  const [template, setTemplate] = useState<TaskTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    try {
      const foundTemplate = getTemplate(id)
      setTemplate(foundTemplate)
    } catch (error) {
      console.error('Error loading template:', error)
      setTemplate(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  return {
    template,
    isLoading
  }
}