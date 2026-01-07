'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Save,
  AlertCircle
} from 'lucide-react'
import { TaskTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '@/types'
import { useTaskTemplates } from '@/hooks/use-task-templates'

interface TemplateFormProps {
  isOpen: boolean
  onClose: () => void
  template?: TaskTemplate | null
  onSuccess?: () => void
}

export function TemplateForm({ 
  isOpen, 
  onClose, 
  template, 
  onSuccess 
}: TemplateFormProps) {
  const { create, update, extractVariables, validateTemplate } = useTaskTemplates()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt_template: ''
  })
  
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (isOpen) {
      if (template) {
        // 编辑模式
        setFormData({
          name: template.name,
          description: template.description,
          prompt_template: template.prompt_template
        })
      } else {
        // 创建模式
        setFormData({
          name: '',
          description: '',
          prompt_template: ''
        })
      }
      setErrors([])
    }
  }, [isOpen, template])

  // 提取变量
  const extractedVariables = extractVariables(formData.prompt_template)

  // 验证表单
  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!formData.name.trim()) {
      newErrors.push('请填写模版名称')
    }
    
    if (!formData.description.trim()) {
      newErrors.push('请填写模版描述')
    }
    
    if (!formData.prompt_template.trim()) {
      newErrors.push('请填写模版内容')
    }
    
    // 验证模版格式
    const templateValidation = validateTemplate(formData.prompt_template)
    if (!templateValidation.isValid) {
      newErrors.push(...templateValidation.errors)
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      if (template) {
        // 更新模版
        const updateRequest: UpdateTemplateRequest = {
          id: template.id,
          name: formData.name,
          description: formData.description,
          prompt_template: formData.prompt_template,
          variables: extractedVariables
        }
        update(updateRequest)
      } else {
        // 创建模版
        const createRequest: CreateTemplateRequest = {
          name: formData.name,
          description: formData.description,
          prompt_template: formData.prompt_template,
          variables: extractedVariables
        }
        create(createRequest)
      }
      
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error saving template:', error)
      setErrors(['保存模版失败，请稍后重试'])
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {template ? '编辑模版' : '创建新模版'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {template ? '修改模版信息和内容' : '创建一个新的任务描述模版'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  模版名称 <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="例如：Bug修复模版"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  模版描述 <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="简要描述这个模版的用途"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* 模版内容 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">模版内容</CardTitle>
              <CardDescription className="text-xs">
                使用 {`{{变量名}}`} 的格式定义变量，例如：{`{{项目名称}}`}、{`{{目标文件}}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="请修复 {{项目名称}} 项目中的 {{问题描述}}&#10;&#10;具体要求：&#10;1. 分析问题原因&#10;2. 提供解决方案&#10;3. 确保不影响其他功能"
                rows={8}
                value={formData.prompt_template}
                onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* 变量预览 */}
          {extractedVariables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">检测到的变量</CardTitle>
                <CardDescription className="text-xs">
                  系统自动提取的模版变量
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {extractedVariables.map((variable, index) => (
                    <Badge key={index} variant="secondary">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


          {/* 错误信息 */}
          {errors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">请修正以下问题：</p>
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? '保存中...' : (template ? '更新模版' : '创建模版')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}