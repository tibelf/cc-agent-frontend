import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 从环境变量读取配置
const CC_AGENT_PATH = process.env.CC_AGENT_PATH || '/root/agent-platform/cc-agent'
const PYTHON_CMD = process.env.PYTHON_CMD || 'python3.11'

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
            `cd ${CC_AGENT_PATH} && ${PYTHON_CMD} taskctl.py system status`
          )

          if (checkOutput.includes('Running')) {
            result = {
              success: true,
              message: '服务已在运行',
              status: 'running'
            }
          } else {
            // 启动服务
            await execAsync(
              `cd ${CC_AGENT_PATH} && nohup ${PYTHON_CMD} auto_claude.py > /tmp/auto_claude.log 2>&1 &`
            )
            result = {
              success: true,
              message: '服务启动成功',
              status: 'starting'
            }
          }
        } catch (error) {
          result = {
            success: false,
            message: `启动失败: ${error instanceof Error ? error.message : '未知错误'}`,
            status: 'error'
          }
        }
        break

      case 'stop':
        try {
          await execAsync(`cd ${CC_AGENT_PATH} && ${PYTHON_CMD} taskctl.py system stop`)
          result = {
            success: true,
            message: '服务停止成功',
            status: 'stopped'
          }
        } catch (error) {
          result = {
            success: false,
            message: `停止失败: ${error instanceof Error ? error.message : '未知错误'}`,
            status: 'error'
          }
        }
        break

      case 'status':
        try {
          const { stdout } = await execAsync(
            `cd ${CC_AGENT_PATH} && ${PYTHON_CMD} taskctl.py system status`
          )
          const isRunning = stdout.includes('Running')
          result = {
            success: true,
            message: stdout.trim(),
            status: isRunning ? 'running' : 'stopped'
          }
        } catch (error) {
          result = {
            success: false,
            message: `状态检查失败: ${error instanceof Error ? error.message : '未知错误'}`,
            status: 'error'
          }
        }
        break
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('服务操作失败:', error)

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '操作失败',
      status: 'error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { stdout } = await execAsync(
      `cd ${CC_AGENT_PATH} && ${PYTHON_CMD} taskctl.py system status`
    )

    return NextResponse.json({
      success: true,
      message: 'Service API is available',
      ccAgentPath: CC_AGENT_PATH,
      pythonCmd: PYTHON_CMD,
      status: stdout.trim()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Service API error',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 503 })
  }
}
