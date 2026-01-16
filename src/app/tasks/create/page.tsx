'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TemplateSelector } from '@/components/templates/template-selector'
import { VariableForm } from '@/components/templates/variable-form'
import { 
  ArrowLeft,
  Wand2,
  Eye,
  EyeOff,
  Info,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText
} from 'lucide-react'
import { TaskType, TaskPriority, CreateTaskRequest, TaskTemplate } from '@/types'
import { useCreateCLITask, useAddCLIScheduledTask } from '@/hooks/use-cli-tasks'

const TASK_TYPES = [
  {
    value: 'lightweight',
    label: '轻量级任务',
    description: '简单任务，可以从头重新开始',
    permissions: ['Read', 'Grep', 'Glob'],
    examples: ['代码分析', '简单查询', '文档生成'],
    color: 'bg-info/10 text-info border-info/30'
  },
  {
    value: 'medium_context',
    label: '中等上下文',
    description: '需要部分历史记录的任务',
    permissions: ['Read', 'Write', 'Edit', 'Git', 'MCP工具'],
    examples: ['代码重构', 'Bug修复', '功能实现'],
    color: 'bg-warning/10 text-warning border-warning/30'
  },
  {
    value: 'heavy_context',
    label: '重上下文任务',
    description: '需要完整执行历史的复杂任务',
    permissions: ['Read', 'Write', 'Edit', 'Bash', 'WebFetch', '全部MCP工具'],
    examples: ['大规模重构', '系统优化', '复杂分析'],
    color: 'bg-destructive/10 text-destructive border-destructive/30'
  }
]

const PRIORITIES = [
  { value: 'low', label: '低优先级', color: 'text-muted-foreground bg-muted' },
  { value: 'normal', label: '普通', color: 'text-info bg-info/10' },
  { value: 'high', label: '高优先级', color: 'text-warning bg-warning/10' },
  { value: 'urgent', label: '紧急', color: 'text-destructive bg-destructive/10' }
]

// 常用的cron表达式示例
const CRON_EXAMPLES = [
  { expression: '0 9 * * 1-5', description: '每周一到周五上午9点' },
  { expression: '0 0 * * *', description: '每天午夜' },
  { expression: '0 */6 * * *', description: '每6小时' },
  { expression: '0 9 * * 1', description: '每周一上午9点' },
  { expression: '0 18 * * 1-5', description: '每个工作日下午6点' },
  { expression: '30 2 * * *', description: '每天凌晨2:30' }
]

// 验证cron表达式
function validateCronExpression(cronExpr: string): { valid: boolean; error?: string } {
  if (!cronExpr.trim()) {
    return { valid: false, error: 'Cron表达式不能为空' }
  }

  const parts = cronExpr.trim().split(/\s+/)
  if (parts.length !== 5) {
    return { valid: false, error: 'Cron表达式必须有5个部分：分钟 小时 日 月 星期' }
  }

  const [minute, hour, day, month, weekday] = parts

  // 简单验证每个部分
  const patterns = [
    { part: minute, name: '分钟', range: [0, 59] },
    { part: hour, name: '小时', range: [0, 23] },
    { part: day, name: '日', range: [1, 31] },
    { part: month, name: '月', range: [1, 12] },
    { part: weekday, name: '星期', range: [0, 7] }
  ]

  for (const { part, name, range } of patterns) {
    if (part === '*') continue
    
    // 检查范围格式 (如: 1-5)
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number)
      if (isNaN(start) || isNaN(end) || start < range[0] || end > range[1] || start > end) {
        return { valid: false, error: `${name}范围无效: ${part}` }
      }
      continue
    }
    
    // 检查步长格式 (如: */6)
    if (part.includes('/')) {
      const [base, step] = part.split('/')
      if (base !== '*' && (isNaN(Number(base)) || Number(base) < range[0] || Number(base) > range[1])) {
        return { valid: false, error: `${name}基数无效: ${base}` }
      }
      if (isNaN(Number(step)) || Number(step) < 1) {
        return { valid: false, error: `${name}步长无效: ${step}` }
      }
      continue
    }
    
    // 检查逗号分隔的值 (如: 1,3,5)
    if (part.includes(',')) {
      const values = part.split(',').map(Number)
      for (const val of values) {
        if (isNaN(val) || val < range[0] || val > range[1]) {
          return { valid: false, error: `${name}值无效: ${val}` }
        }
      }
      continue
    }
    
    // 检查单个数值
    const num = Number(part)
    if (isNaN(num) || num < range[0] || num > range[1]) {
      return { valid: false, error: `${name}值无效: ${part}` }
    }
  }

  return { valid: true }
}

export default function CreateTaskPage() {
  const router = useRouter()
  const createTaskMutation = useCreateCLITask()
  const addScheduledTaskMutation = useAddCLIScheduledTask()

  const [formData, setFormData] = useState<CreateTaskRequest>({
    name: '',
    description: '',
    task_type: TaskType.MEDIUM_CONTEXT,
    priority: TaskPriority.NORMAL,
    auto_execute: true,
    working_dir: '',
    environment: {},
    tags: [],
    is_scheduled: false,
    cron_expression: ''
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showGeneratedCommand, setShowGeneratedCommand] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [envKey, setEnvKey] = useState('')
  const [envValue, setEnvValue] = useState('')
  
  // 模版相关状态
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showVariableForm, setShowVariableForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)

  // 生成Claude命令或定时任务信息
  const generateCommand = () => {
    if (!formData.description) return ''

    if (formData.is_scheduled) {
      // 定时任务信息
      return `定时任务配置：
任务名称：${formData.name}
描述：${formData.description}
Cron表达式：${formData.cron_expression || '未设置'}
任务类型：${TASK_TYPES.find(t => t.value === formData.task_type)?.label}
${formData.working_dir ? `工作目录：${formData.working_dir}` : ''}

执行方式：将按照Cron表达式自动创建并执行任务`
    }

    // 普通任务命令
    const selectedType = TASK_TYPES.find(t => t.value === formData.task_type)
    const permissions = selectedType?.permissions.join('" "') || ''
    
    const autoExecuteSuffix = formData.auto_execute ? `

IMPORTANT: This is an automated task execution. Do not ask for confirmation or user input. 
If you have the necessary tools and permissions, execute the requested actions directly.
If you cannot complete the action due to missing tools or authentication, 
provide specific instructions for manual completion instead of asking for confirmation.` : ''

    return `claude -p "${formData.description}${autoExecuteSuffix}" --verbose --output-format json --permission-mode acceptEdits --allowedTools "${permissions}"${formData.working_dir ? ` --cwd "${formData.working_dir}"` : ''}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description) {
      alert('请填写任务描述')
      return
    }

    // 如果是定时任务，验证cron表达式
    if (formData.is_scheduled) {
      if (!formData.cron_expression) {
        alert('请填写Cron表达式')
        return
      }
      
      const cronValidation = validateCronExpression(formData.cron_expression)
      if (!cronValidation.valid) {
        alert('Cron表达式错误：' + cronValidation.error)
        return
      }
    }

    try {
      if (formData.is_scheduled) {
        // 创建定时任务
        const result = await addScheduledTaskMutation.mutateAsync({
          name: formData.name,
          description: formData.description || '',
          cron: formData.cron_expression || '',
          type: formData.task_type,
          workingDir: formData.working_dir
        })
        
        if (result.success) {
          router.push('/tasks')
        } else {
          alert('创建定时任务失败：' + result.error)
        }
      } else {
        // 创建普通任务
        const result = await createTaskMutation.mutateAsync({
          name: formData.name,
          description: formData.description,
          type: formData.task_type,
          priority: formData.priority
        })
        if (result.success) {
          router.push('/tasks')
        } else {
          alert('创建任务失败：' + result.error)
        }
      }
    } catch (error) {
      console.error('创建任务错误:', error)
      alert('创建任务失败，请稍后重试')
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !(formData.tags || []).includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter(tag => tag !== tagToRemove)
    })
  }

  const addEnvVar = () => {
    if (envKey.trim() && envValue.trim()) {
      setFormData({
        ...formData,
        environment: {
          ...(formData.environment || {}),
          [envKey.trim()]: envValue.trim()
        }
      })
      setEnvKey('')
      setEnvValue('')
    }
  }

  const removeEnvVar = (key: string) => {
    const newEnv = { ...(formData.environment || {}) }
    delete newEnv[key]
    setFormData({
      ...formData,
      environment: newEnv
    })
  }

  const selectedTaskType = TASK_TYPES.find(t => t.value === formData.task_type)

  // 处理模版选择
  const handleTemplateSelect = (template: TaskTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateSelector(false)
    
    if (template.variables.length > 0) {
      // 如果模版有变量，显示变量表单
      setShowVariableForm(true)
    } else {
      // 如果没有变量，直接应用模版
      setFormData({
        ...formData,
        description: template.prompt_template
      })
    }
  }

  // 处理模版应用
  const handleApplyTemplate = (renderedDescription: string) => {
    setFormData({
      ...formData,
      description: renderedDescription
    })
    setShowVariableForm(false)
    setSelectedTemplate(null)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回任务列表
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">创建新任务</h1>
            <p className="text-muted-foreground">配置Claude代码任务或定时任务参数</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 基本信息 */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">基本信息</CardTitle>
              <CardDescription className="text-xs">任务的基本配置信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                {/* 任务描述 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    任务描述 <span className="text-destructive">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplateSelector(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    使用模版
                  </Button>
                </div>
                <Textarea
                  placeholder="详细描述要执行的任务内容..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  清晰详细的描述有助于Claude更好地理解和执行任务
                </p>
              </div>

              {/* 优先级 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  优先级
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {PRIORITIES.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: priority.value as TaskPriority })}
                      className={`py-1.5 px-2 rounded border text-xs font-medium transition-colors ${
                        formData.priority === priority.value
                          ? priority.color + ' border-current'
                          : 'text-muted-foreground bg-background border-border hover:bg-accent'
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 自动执行和定时任务并列 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 启用自动执行 */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="auto_execute"
                    checked={formData.auto_execute}
                    onChange={(e) => setFormData({ ...formData, auto_execute: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <label htmlFor="auto_execute" className="text-sm font-medium text-foreground cursor-pointer">
                      启用自动执行
                    </label>
                    <p className="text-xs text-muted-foreground">
                      任务将自动回答确认提示
                    </p>
                  </div>
                </div>

                {/* 定时任务 */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_scheduled"
                    checked={formData.is_scheduled}
                    onChange={(e) => setFormData({
                      ...formData,
                      is_scheduled: e.target.checked,
                      cron_expression: e.target.checked ? formData.cron_expression : ''
                    })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <label htmlFor="is_scheduled" className="text-sm font-medium text-foreground cursor-pointer flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      定时任务
                    </label>
                    <p className="text-xs text-muted-foreground">
                      按计划自动执行任务
                    </p>
                  </div>
                </div>
              </div>

              {/* Cron表达式输入 */}
              {formData.is_scheduled && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Cron表达式 <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="例如: 0 9 * * 1-5 (工作日上午9点)"
                        value={formData.cron_expression || ''}
                        onChange={(e) => setFormData({ ...formData, cron_expression: e.target.value })}
                        className={`${formData.cron_expression && !validateCronExpression(formData.cron_expression).valid
                          ? 'border-destructive/50 focus:border-destructive focus:ring-destructive/20'
                          : ''}`}
                      />
                      {formData.cron_expression && !validateCronExpression(formData.cron_expression).valid && (
                        <p className="text-xs text-destructive mt-1">
                          {validateCronExpression(formData.cron_expression).error}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        格式：分钟 小时 日 月 星期 (使用空格分隔)
                      </p>
                    </div>
                    
                    {/* 常用示例 */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        常用示例
                      </label>
                      <div className="grid grid-cols-1 gap-1">
                        {CRON_EXAMPLES.map((example, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setFormData({ ...formData, cron_expression: example.expression })}
                            className="text-left p-2 text-xs bg-muted hover:bg-accent rounded transition-colors"
                          >
                            <code className="font-mono">{example.expression}</code>
                            <span className="text-muted-foreground ml-2">{example.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* 任务类型 */}
          <Card className="flex flex-col">
            <CardHeader className="py-3">
              <CardTitle className="text-base">任务类型</CardTitle>
              <CardDescription className="text-xs">选择合适的任务类型以获得最佳性能</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-2 pt-0">
              {TASK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, task_type: type.value as TaskType })}
                  className={`w-full p-2.5 rounded-lg border text-left transition-colors flex-1 flex flex-col justify-center ${
                    formData.task_type === type.value
                      ? type.color + ' border-current'
                      : 'bg-background border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm">{type.label}</h3>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                    {formData.task_type === type.value && (
                      <CheckCircle className="h-4 w-4 text-current flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex flex-wrap gap-1">
                      {type.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      适用于: {type.examples.join('、')}
                    </span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>


        {/* 高级配置 */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">高级配置</CardTitle>
                <CardDescription className="text-xs">可选的高级任务配置</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showAdvanced ? '隐藏' : '显示'}
              </Button>
            </div>
          </CardHeader>
          {showAdvanced && (
            <CardContent className="space-y-3 pt-0">
              {/* 工作目录 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  工作目录
                </label>
                <Input
                  placeholder="例如：/path/to/project"
                  value={formData.working_dir}
                  onChange={(e) => setFormData({ ...formData, working_dir: e.target.value })}
                />
              </div>

              {/* 标签 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  标签
                </label>
                <div className="flex space-x-2 mb-2">
                  <Input
                    placeholder="添加标签"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    添加
                  </Button>
                </div>
                {(formData.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(formData.tags || []).map((tag, index) => (
                      <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 环境变量 */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  环境变量
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input
                    placeholder="变量名"
                    value={envKey}
                    onChange={(e) => setEnvKey(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Input
                      placeholder="值"
                      value={envValue}
                      onChange={(e) => setEnvValue(e.target.value)}
                    />
                    <Button type="button" onClick={addEnvVar} variant="outline">
                      添加
                    </Button>
                  </div>
                </div>
                {Object.keys(formData.environment || {}).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(formData.environment || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span>{key} = {value}</span>
                        <button type="button" onClick={() => removeEnvVar(key)} className="text-destructive hover:text-destructive/80">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* 生成的命令预览 */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Wand2 className="h-4 w-4" />
                  <span>生成的Claude命令</span>
                </CardTitle>
                <CardDescription className="text-xs">系统将自动生成以下命令</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowGeneratedCommand(!showGeneratedCommand)}
              >
                {showGeneratedCommand ? '隐藏命令' : '查看命令'}
              </Button>
            </div>
          </CardHeader>
          {showGeneratedCommand && (
            <CardContent className="pt-0">
              <div className="bg-muted p-3 rounded-lg">
                <code className="text-sm whitespace-pre-wrap break-all">
                  {generateCommand() || '请先填写任务描述'}
                </code>
              </div>
              {selectedTaskType && (
                <div className="mt-4 p-3 bg-info/10 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-info">
                      <div className="font-medium mb-1">任务类型说明：{selectedTaskType.label}</div>
                      <div className="mb-2">{selectedTaskType.description}</div>
                      <div className="text-xs">
                        <strong>可用权限：</strong> {selectedTaskType.permissions.join('、')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* 提交按钮 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {formData.description ? (
                  <span className="flex items-center text-success">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    任务配置已完成
                  </span>
                ) : (
                  <span className="flex items-center text-warning">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    请填写任务描述
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <Link href="/tasks">
                  <Button variant="outline">取消</Button>
                </Link>
                <Button
                  type="submit"
                  disabled={
                    !formData.description ||
                    (formData.is_scheduled && (!formData.cron_expression || !validateCronExpression(formData.cron_expression).valid)) ||
                    createTaskMutation.isPending ||
                    addScheduledTaskMutation.isPending
                  }
                >
                  {(createTaskMutation.isPending || addScheduledTaskMutation.isPending) 
                    ? '创建中...' 
                    : (formData.is_scheduled ? '创建定时任务' : '创建任务')
                  }
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* 模版选择弹窗 */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* 变量输入弹窗 */}
      <VariableForm
        isOpen={showVariableForm}
        onClose={() => {
          setShowVariableForm(false)
          setSelectedTemplate(null)
        }}
        template={selectedTemplate}
        onApplyTemplate={handleApplyTemplate}
      />
    </div>
  )
}