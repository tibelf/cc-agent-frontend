'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react'
import { TaskTemplate } from '@/types'

interface VariableFormProps {
  isOpen: boolean
  onClose: () => void
  template: TaskTemplate | null
  onApplyTemplate: (renderedDescription: string) => void
}

export function VariableForm({ 
  isOpen, 
  onClose, 
  template, 
  onApplyTemplate 
}: VariableFormProps) {
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  // 重置表单
  const resetForm = () => {
    setVariables({})
    setShowPreview(false)
  }

  // 处理模版变化
  const handleTemplateChange = () => {
    if (template) {
      const initialVars: Record<string, string> = {}
      template.variables.forEach(varName => {
        initialVars[varName] = ''
      })
      setVariables(initialVars)
    }
  }

  // 当模版变化时重置表单
  React.useEffect(() => {
    if (template && isOpen) {
      handleTemplateChange()
    } else if (!isOpen) {
      resetForm()
    }
  }, [template, isOpen])

  if (!template) return null

  // 渲染模版预览
  const renderPreview = () => {
    let preview = template.prompt_template
    
    for (const [varName, varValue] of Object.entries(variables)) {
      const placeholder = `{{${varName}}}`
      preview = preview.replace(new RegExp(placeholder, 'g'), varValue || `{{${varName}}}`)
    }
    
    return preview
  }

  // 检查所有变量是否都已填写
  const isFormValid = () => {
    return template.variables.every(varName => variables[varName]?.trim())
  }

  // 应用模版
  const handleApply = () => {
    if (!isFormValid()) return
    
    const renderedDescription = renderPreview()
    onApplyTemplate(renderedDescription)
    onClose()
    resetForm()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>配置模版变量</span>
          </h2>
          <p className="text-sm text-muted-foreground">为 "{template.name}" 填写变量值</p>
        </div>

        <div className="space-y-6">
          {/* 模版信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{template.name}</CardTitle>
              <CardDescription className="text-xs">{template.description}</CardDescription>
            </CardHeader>
          </Card>

          {/* 变量输入 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">变量配置</CardTitle>
              <CardDescription className="text-xs">
                请填写以下变量的值
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.variables.map((varName) => (
                <div key={varName}>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {varName} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder={`请输入${varName}`}
                    value={variables[varName] || ''}
                    onChange={(e) => setVariables({
                      ...variables,
                      [varName]: e.target.value
                    })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 预览 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">预览</CardTitle>
                  <CardDescription className="text-xs">
                    查看生成的任务描述
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPreview ? '隐藏' : '显示'}
                </Button>
              </div>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap text-foreground">
                    {renderPreview()}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button 
              onClick={handleApply}
              disabled={!isFormValid()}
            >
              <Check className="h-4 w-4 mr-2" />
              应用模版
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}