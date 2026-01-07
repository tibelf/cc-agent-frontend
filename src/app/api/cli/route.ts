import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// cc-agent 项目路径
const CC_AGENT_PATH = '/Users/tibelf/Github/cc-agent'

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

    console.log(`执行命令: ${command}`)
    
    const { stdout, stderr } = await execAsync(`cd ${CC_AGENT_PATH} && python ${command}`)
    
    if (stderr) {
      console.warn('Command stderr:', stderr)
    }

    return NextResponse.json({
      success: true,
      output: stdout.trim(),
      error: stderr || null
    })

  } catch (error: any) {
    console.error('命令执行失败:', error)
    
    return NextResponse.json({
      success: false,
      output: '',
      error: error.message || '命令执行失败'
    }, { status: 500 })
  }
}

// 健康检查端点
export async function GET() {
  try {
    const { stdout } = await execAsync(`cd ${CC_AGENT_PATH} && python taskctl.py --help`)
    return NextResponse.json({
      success: true,
      available: true,
      message: 'cc-agent CLI 可用'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      available: false,
      message: 'cc-agent CLI 不可用',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}