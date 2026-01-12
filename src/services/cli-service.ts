// API 基础路径
const API_BASE = '/api/cli'

export interface CLITask {
  id: string
  name: string
  description?: string
  task_state: string
  priority: string
  task_type: string
  command?: string
  created_at: string
  started_at?: string
  completed_at?: string
  assigned_worker?: string
  retry_count: number
  tags?: string[]
  last_error?: string
  next_allowed_at?: string
}

export interface CLIWorker {
  worker_id: string
  process_id?: number
  state: string
  current_task_id?: string
  last_heartbeat: string
  cpu_usage?: number
  memory_usage?: number
  uptime_seconds: number
  tasks_completed: number
  tasks_failed: number
}

export interface CLIScheduledTask {
  task_id: string
  name: string
  description: string
  cron_expression: string
  task_type: string
  working_dir?: string
  enabled: boolean
  created_at: string
}

export class CLIService {
  /**
   * 执行 cc-agent 命令
   */
  private static async executeCommand(command: string): Promise<string> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '命令执行失败')
      }

      if (result.error) {
        console.warn('Command stderr:', result.error)
      }

      console.log('CLI command result:', { command, outputLength: result.output?.length })
      return result.output
    } catch (error) {
      console.error('Command execution failed:', error)
      const err = error as Error
      throw new Error(`命令执行失败: ${err.message}`)
    }
  }

  /**
   * 解析 JSON 输出，如果不是 JSON 则返回原文本
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static parseOutput(output: string): any {
    if (!output || typeof output !== 'string') {
      console.warn('Empty or invalid output received:', output)
      return []
    }

    try {
      const parsed = JSON.parse(output)
      console.log('Successfully parsed JSON:', { type: typeof parsed, isArray: Array.isArray(parsed), length: parsed?.length })
      return parsed
    } catch (error) {
      console.warn('Failed to parse JSON, trying table format:', error)
      // 如果不是JSON，尝试解析为表格数据
      return CLIService.parseTableOutput(output)
    }
  }

  /**
   * 解析系统状态文本输出
   * 主要检测 auto_claude.py worker 服务是否运行
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static parseSystemStatus(output: string): any {
    const lines = output.split('\n').filter(line => line.trim())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status: any = {
      status: 'critical', // 默认为关键状态
      active_workers: 0,
      pending_tasks: 0,
      processing_tasks: 0,
      disk_space_gb: 0,
      memory_usage_percent: 0,
      uptime_seconds: 0,
      last_updated: new Date().toISOString(),
      auto_claude_running: false
    }

    // 检查 auto_claude.py 进程状态
    const hasAutoClaude = output.includes('auto_claude.py') || 
                         output.includes('Auto-Claude system is running') ||
                         output.includes('Worker services: active')
    
    if (hasAutoClaude) {
      status.auto_claude_running = true
      status.status = 'healthy'
    }

    // 解析其他状态信息
    for (const line of lines) {
      if (line.includes('auto_claude.py') && line.includes('running')) {
        status.auto_claude_running = true
        status.status = 'healthy'
      } else if (line.includes('Overall Status:') || line.includes('System Status:')) {
        const match = line.match(/Status:\s*(\w+)/)
        if (match) {
          const systemStatus = match[1].toLowerCase()
          status.status = systemStatus === 'healthy' || systemStatus === 'running' ? 'healthy' : 
                         systemStatus === 'degraded' || systemStatus === 'warning' ? 'warning' : 'critical'
        }
      } else if (line.includes('Active workers:') || line.includes('Workers:')) {
        const match = line.match(/(\d+)/)
        if (match) status.active_workers = parseInt(match[1])
      } else if (line.includes('Pending:') || line.includes('Pending tasks:')) {
        const match = line.match(/(\d+)/)
        if (match) status.pending_tasks = parseInt(match[1])
      } else if (line.includes('Processing:') || line.includes('Processing tasks:')) {
        const match = line.match(/(\d+)/)
        if (match) status.processing_tasks = parseInt(match[1])
      } else if (line.includes('Disk free:')) {
        const match = line.match(/([\d.]+)\s*GB/)
        if (match) status.disk_space_gb = parseFloat(match[1])
      } else if (line.includes('Memory usage:')) {
        const match = line.match(/([\d.]+)%/)
        if (match) status.memory_usage_percent = parseFloat(match[1])
      } else if (line.includes('Uptime:')) {
        const match = line.match(/(\d+)\s*seconds/)
        if (match) status.uptime_seconds = parseInt(match[1])
      }
    }

    console.log('Parsed system status:', status)
    return status
  }

  /**
   * 解析表格格式的输出（taskctl.py的默认输出格式）
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static parseTableOutput(output: string): any[] {
    const lines = output.split('\n').filter(line => line.trim())
    if (lines.length <= 2) return []

    // 假设第一行是标题，第二行是分隔符
    const headers = lines[0].split(/\s+/)
    const dataLines = lines.slice(2)

    return dataLines.map(line => {
      const values = line.split(/\s+/)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header.toLowerCase()] = values[index] || ''
      })
      return obj
    })
  }

  /**
   * 获取任务列表
   */
  static async listTasks(params?: {
    state?: string
    priority?: string
    format?: 'json' | 'table'
  }): Promise<CLITask[]> {
    let command = 'taskctl.py task list'
    
    if (params?.state) {
      command += ` --state ${params.state}`
    }
    
    if (params?.priority) {
      command += ` --priority ${params.priority}`
    }
    
    if (params?.format === 'json') {
      command += ' --format json'
    }

    const output = await CLIService.executeCommand(command)
    const data = CLIService.parseOutput(output)

    // 如果是数组格式，直接返回；否则提取 tasks 字段
    return Array.isArray(data) ? data : (data.tasks || [])
  }

  /**
   * 获取任务详情
   */
  static async getTask(taskId: string): Promise<CLITask | null> {
    try {
      const command = `taskctl.py task show ${taskId} --format json`
      const output = await CLIService.executeCommand(command)
      const data = CLIService.parseOutput(output)
      return data
    } catch (error) {
      console.error('获取任务详情失败:', error)
      return null
    }
  }

  /**
   * 创建任务
   */
  static async createTask(params: {
    name: string
    description: string
    type?: 'lightweight' | 'medium_context' | 'heavy_context'
    priority?: 'low' | 'normal' | 'high' | 'urgent'
  }): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      let command = `taskctl.py task create "${params.name}" --description "${params.description}"`
      
      if (params.type) {
        command += ` --type ${params.type}`
      }
      
      if (params.priority) {
        command += ` --priority ${params.priority}`
      }

      const output = await CLIService.executeCommand(command)
      
      // 尝试从输出中提取任务ID
      const taskIdMatch = output.match(/Task\s+([a-zA-Z0-9_]+)\s+created/i)
      const taskId = taskIdMatch ? taskIdMatch[1] : undefined

      return { success: true, taskId }
    } catch (error) {
      const err = error as Error
      return { success: false, error: err.message }
    }
  }

  /**
   * 任务操作（取消、重试、暂停、恢复）
   */
  static async taskAction(
    taskId: string, 
    action: 'cancel' | 'retry' | 'pause' | 'resume',
    options?: { force?: boolean }
  ): Promise<{ success: boolean; message?: string }> {
    try {
      let command = `taskctl.py task ${action} ${taskId}`
      
      // 如果是重试操作且设置了强制标志，添加 --force 参数
      if (action === 'retry' && options?.force) {
        command += ' --force'
      }
      
      const output = await CLIService.executeCommand(command)
      return { success: true, message: output }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }

  /**
   * 获取任务日志
   */
  static async getTaskLogs(taskId: string): Promise<string[]> {
    try {
      const command = `taskctl.py task show ${taskId} --show-logs`
      const output = await CLIService.executeCommand(command)
      return output.split('\n').filter(line => line.trim())
    } catch (error) {
      console.error('获取任务日志失败:', error)
      return []
    }
  }

  /**
   * 获取系统状态
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getSystemStatus(): Promise<any> {
    try {
      const command = 'taskctl.py system status'
      const output = await CLIService.executeCommand(command)
      return CLIService.parseSystemStatus(output)
    } catch (error) {
      console.error('获取系统状态失败:', error)
      return null
    }
  }

  /**
   * 获取工作器列表
   */
  static async listWorkers(): Promise<CLIWorker[]> {
    try {
      const command = 'taskctl.py worker list --format json'
      const output = await CLIService.executeCommand(command)
      const data = CLIService.parseOutput(output)
      return Array.isArray(data) ? data : (data.workers || [])
    } catch (error) {
      console.error('获取工作器列表失败:', error)
      return []
    }
  }

  /**
   * 获取工作器详情
   */
  static async getWorker(workerId: string): Promise<CLIWorker | null> {
    try {
      const command = `taskctl.py worker show ${workerId} --format json`
      const output = await CLIService.executeCommand(command)
      return CLIService.parseOutput(output)
    } catch (error) {
      console.error('获取工作器详情失败:', error)
      return null
    }
  }

  /**
   * 重启工作器
   */
  static async restartWorker(workerId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const command = `taskctl.py worker restart ${workerId}`
      const output = await CLIService.executeCommand(command)
      return { success: true, message: output }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }

  /**
   * 获取任务统计
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getTaskStats(): Promise<any> {
    try {
      // 通过任务列表计算统计信息
      const tasks = await CLIService.listTasks({ format: 'json' })
      
      const stats = {
        total: tasks.length,
        pending: tasks.filter(t => t.task_state === 'pending').length,
        processing: tasks.filter(t => t.task_state === 'processing').length,
        completed: tasks.filter(t => t.task_state === 'completed').length,
        failed: tasks.filter(t => t.task_state === 'failed').length,
        by_priority: {
          urgent: tasks.filter(t => t.priority === 'urgent').length,
          high: tasks.filter(t => t.priority === 'high').length,
          normal: tasks.filter(t => t.priority === 'normal').length,
          low: tasks.filter(t => t.priority === 'low').length,
        },
        by_type: {
          lightweight: tasks.filter(t => t.task_type === 'lightweight').length,
          medium_context: tasks.filter(t => t.task_type === 'medium_context').length,
          heavy_context: tasks.filter(t => t.task_type === 'heavy_context').length,
        }
      }

      return stats
    } catch (error) {
      console.error('获取任务统计失败:', error)
      return {
        total: 0, pending: 0, processing: 0, completed: 0, failed: 0,
        by_priority: { urgent: 0, high: 0, normal: 0, low: 0 },
        by_type: { lightweight: 0, medium_context: 0, heavy_context: 0 }
      }
    }
  }

  /**
   * 检查 cc-agent 是否可用
   */
  static async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(API_BASE, { method: 'GET' })
      const result = await response.json()
      return result.available === true
    } catch (error) {
      console.error('cc-agent 不可用:', error)
      return false
    }
  }

  /**
   * 获取定时任务列表
   */
  static async listScheduledTasks(): Promise<CLIScheduledTask[]> {
    try {
      const command = 'taskctl.py schedule list --format json'
      const output = await CLIService.executeCommand(command)
      const data = CLIService.parseOutput(output)
      return Array.isArray(data) ? data : (data.scheduled_tasks || [])
    } catch (error) {
      console.error('获取定时任务列表失败:', error)
      return []
    }
  }

  /**
   * 添加定时任务
   */
  static async addScheduledTask(params: {
    name: string
    description: string
    cron: string
    type?: 'lightweight' | 'medium_context' | 'heavy_context'
    workingDir?: string
  }): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      let command = `taskctl.py schedule add "${params.name}" --description "${params.description}" --cron "${params.cron}"`
      
      if (params.type) {
        command += ` --type ${params.type}`
      }
      
      if (params.workingDir) {
        command += ` --working-dir "${params.workingDir}"`
      }

      const output = await CLIService.executeCommand(command)
      
      // 尝试从输出中提取任务ID
      const taskIdMatch = output.match(/Task\s+ID:\s+([a-zA-Z0-9_]+)/i)
      const taskId = taskIdMatch ? taskIdMatch[1] : undefined

      return { success: true, taskId }
    } catch (error) {
      const err = error as Error
      return { success: false, error: err.message }
    }
  }

  /**
   * 删除定时任务
   */
  static async removeScheduledTask(taskId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const command = `taskctl.py schedule remove ${taskId}`
      const output = await CLIService.executeCommand(command)
      return { success: true, message: output }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }

  /**
   * 启用/禁用定时任务
   */
  static async toggleScheduledTask(taskId: string, enable: boolean): Promise<{ success: boolean; message?: string }> {
    try {
      const action = enable ? 'enable' : 'disable'
      const command = `taskctl.py schedule ${action} ${taskId}`
      const output = await CLIService.executeCommand(command)
      return { success: true, message: output }
    } catch (error) {
      const err = error as Error
      return { success: false, message: err.message }
    }
  }
}
