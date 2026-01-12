import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 从环境变量读取配置，如果未设置则使用默认值
const CC_AGENT_PATH = process.env.CC_AGENT_PATH || '/root/agent-platform/cc-agent'
const PYTHON_CMD = process.env.PYTHON_CMD || 'python3.11'

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json()

    if (!command) {
      return NextResponse.json({ error: '命令不能为空' }, { status: 400 })
    }

    // 安全检查：只允许执行taskctl.py相关命令
    if (!command.startsWith('taskctl.py')) {
      return NextResponse.json({ error: '只允许执行taskctl.py命令' }, { status: 400 })
    }

    console.log(`执行命令: ${PYTHON_CMD} ${command} (路径: ${CC_AGENT_PATH})`)

    const { stdout, stderr } = await execAsync(`cd ${CC_AGENT_PATH} && ${PYTHON_CMD} ${command}`)

    if (stderr) {
      console.warn('Command stderr:', stderr)
    }

    return NextResponse.json({
      success: true,
      output: stdout.trim(),
      error: stderr || null
    })

  } catch (error) {
    console.error('命令执行失败:', error)

    return NextResponse.json({
      success: false,
      output: '',
      error: error instanceof Error ? error.message : '命令执行失败'
    }, { status: 500 })
  }
}

// 健康检查端点
export async function GET() {
  try {
    await execAsync(`cd ${CC_AGENT_PATH} && ${PYTHON_CMD} taskctl.py --help`)

    return NextResponse.json({
      success: true,
      message: 'CLI service is running',
      ccAgentPath: CC_AGENT_PATH,
      pythonCmd: PYTHON_CMD,
      available: true
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'CLI service is not available',
      ccAgentPath: CC_AGENT_PATH,
      pythonCmd: PYTHON_CMD,
      error: error instanceof Error ? error.message : '未知错误',
      available: false
    }, { status: 503 })
  }
}
