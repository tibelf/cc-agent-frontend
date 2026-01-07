import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// cc-agent 项目路径
const CC_AGENT_PATH = '/Users/tibelf/Github/cc-agent'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (!action || !['start', 'stop', 'status'].includes(action)) {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 })
    }

    let result = { success: false, message: '', status: 'unknown' }

    switch (action) {
      case 'start':
        try {
          // 检查是否已经在运行
          const { stdout: checkOutput } = await execAsync(
            `cd ${CC_AGENT_PATH} && python taskctl.py system status`
          )
          
          if (checkOutput.includes('Running')) {
            result = { 
              success: true, 
              message: 'Auto-Claude 服务已经在运行',
              status: 'running'
            }
          } else {
            // 启动服务
            const startCommand = `cd ${CC_AGENT_PATH} && nohup python auto_claude.py > auto_claude.log 2>&1 &`
            await execAsync(startCommand)
            
            // 等待一下让服务启动
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // 验证启动状态
            const { stdout: verifyOutput } = await execAsync(
              `cd ${CC_AGENT_PATH} && python taskctl.py system status`
            )
            
            if (verifyOutput.includes('Running')) {
              result = { 
                success: true, 
                message: 'Auto-Claude 服务启动成功',
                status: 'running'
              }
            } else {
              result = { 
                success: false, 
                message: '服务启动失败，请检查日志',
                status: 'stopped'
              }
            }
          }
        } catch (error: any) {
          result = { 
            success: false, 
            message: `启动失败: ${error.message}`,
            status: 'error'
          }
        }
        break

      case 'stop':
        try {
          // 查找并终止 auto_claude.py 进程
          const { stdout: psOutput } = await execAsync(
            "ps aux | grep 'python.*auto_claude.py' | grep -v grep || true"
          )
          
          if (psOutput.trim()) {
            // 提取 PID 并终止进程
            const lines = psOutput.trim().split('\n')
            for (const line of lines) {
              const parts = line.split(/\s+/)
              if (parts.length > 1) {
                const pid = parts[1]
                await execAsync(`kill ${pid}`)
              }
            }
            
            // 等待进程完全终止
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            result = { 
              success: true, 
              message: 'Auto-Claude 服务已停止',
              status: 'stopped'
            }
          } else {
            result = { 
              success: true, 
              message: 'Auto-Claude 服务未在运行',
              status: 'stopped'
            }
          }
        } catch (error: any) {
          result = { 
            success: false, 
            message: `停止失败: ${error.message}`,
            status: 'error'
          }
        }
        break

      case 'status':
        try {
          const { stdout } = await execAsync(
            `cd ${CC_AGENT_PATH} && python taskctl.py system status`
          )
          
          const isRunning = stdout.includes('Running')
          result = { 
            success: true, 
            message: isRunning ? 'Auto-Claude 服务运行中' : 'Auto-Claude 服务未运行',
            status: isRunning ? 'running' : 'stopped'
          }
        } catch (error: any) {
          result = { 
            success: false, 
            message: `状态检查失败: ${error.message}`,
            status: 'error'
          }
        }
        break
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('服务操作失败:', error)
    
    return NextResponse.json({
      success: false,
      message: error.message || '操作失败',
      status: 'error'
    }, { status: 500 })
  }
}