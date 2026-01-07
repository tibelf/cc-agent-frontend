'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TemplateForm } from '@/components/templates/template-form'
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  Clock,
  Eye,
  Copy
} from 'lucide-react'
import { TaskTemplate } from '@/types'
import { useTaskTemplates } from '@/hooks/use-task-templates'

export default function TemplatesPage() {
  const { templates, isLoading, remove, reload } = useTaskTemplates()
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteTemplate = (template: TaskTemplate) => {
    if (window.confirm(`确定要删除模版 "${template.name}" 吗？`)) {
      remove(template.id)
    }
  }

  const handleEditTemplate = (template: TaskTemplate) => {
    setEditingTemplate(template)
    setShowTemplateForm(true)
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setShowTemplateForm(true)
  }

  const handleFormSuccess = () => {
    setShowTemplateForm(false)
    setEditingTemplate(null)
    reload()
  }

  const handleCopyTemplate = (template: TaskTemplate) => {
    navigator.clipboard.writeText(template.prompt_template)
    // 这里可以添加一个toast通知
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">任务模版管理</h1>
          <p className="text-muted-foreground">创建和管理任务描述模版</p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          创建模版
        </Button>
      </div>

      {/* 搜索和统计 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索模版..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>共 {templates.length} 个模版</span>
              {searchQuery && (
                <span>找到 {filteredTemplates.length} 个结果</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 模版列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              加载中...
            </CardContent>
          </Card>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? '没有找到匹配的模版' : '暂无模版'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? '尝试使用不同的关键词搜索' 
                  : '创建您的第一个任务描述模版，提升创建任务的效率'
                }
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个模版
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.usage_count > 0 && (
                        <Badge variant="outline">
                          已使用 {template.usage_count} 次
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyTemplate(template)}
                      title="复制模版内容"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 变量列表 */}
                {template.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">模版变量:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 模版内容预览 */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">模版内容预览:</p>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <pre className="whitespace-pre-wrap text-muted-foreground line-clamp-3">
                      {template.prompt_template}
                    </pre>
                  </div>
                </div>

                {/* 元信息 */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>创建于 {new Date(template.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <Link href="/tasks/create">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      在创建任务中使用
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 模版表单弹窗 */}
      <TemplateForm
        isOpen={showTemplateForm}
        onClose={() => {
          setShowTemplateForm(false)
          setEditingTemplate(null)
        }}
        template={editingTemplate}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}