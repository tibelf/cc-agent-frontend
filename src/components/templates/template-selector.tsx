'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Search,
  Clock,
  ChevronRight
} from 'lucide-react'
import { TaskTemplate } from '@/types'
import { useTaskTemplates } from '@/hooks/use-task-templates'

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: TaskTemplate) => void
}

export function TemplateSelector({ isOpen, onClose, onSelectTemplate }: TemplateSelectorProps) {
  const { templates, isLoading } = useTaskTemplates()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectTemplate = (template: TaskTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>选择任务模版</DialogTitle>
          <DialogDescription>选择一个模版快速创建任务</DialogDescription>
        </DialogHeader>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索模版..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 模版列表 */}
        <div className="space-y-4 max-h-96 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? '没有找到匹配的模版' : '暂无模版，请先创建模版'}
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSelectTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <h3 className="font-medium text-foreground">{template.name}</h3>
                        {template.usage_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            已用 {template.usage_count} 次
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>

                      {template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className="text-xs text-muted-foreground">变量:</span>
                          {template.variables.map((variable, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(template.created_at).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
