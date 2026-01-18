import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'templates.json')

interface TemplateData {
  templates: Template[]
}

interface Template {
  id: string
  name: string
  description: string
  prompt_template: string
  variables: string[]
  created_at: string
  usage_count: number
}

// 读取模版数据
async function readTemplates(): Promise<TemplateData> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // 如果文件不存在，返回空数组
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { templates: [] }
    }
    throw error
  }
}

// 写入模版数据
async function writeTemplates(data: TemplateData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// GET /api/templates - 获取所有模版
export async function GET() {
  try {
    const data = await readTemplates()
    return NextResponse.json({
      success: true,
      data: data.templates
    })
  } catch (error) {
    console.error('Error reading templates:', error)
    return NextResponse.json(
      { success: false, error: '读取模版失败' },
      { status: 500 }
    )
  }
}

// POST /api/templates - 创建新模版
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, prompt_template, variables } = body

    // 验证必填字段
    if (!name || !prompt_template) {
      return NextResponse.json(
        { success: false, error: '名称和模版内容为必填项' },
        { status: 400 }
      )
    }

    const data = await readTemplates()

    const newTemplate: Template = {
      id: generateId(),
      name,
      description: description || '',
      prompt_template,
      variables: variables || [],
      created_at: new Date().toISOString(),
      usage_count: 0
    }

    data.templates.push(newTemplate)
    await writeTemplates(data)

    return NextResponse.json({
      success: true,
      data: newTemplate
    })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { success: false, error: '创建模版失败' },
      { status: 500 }
    )
  }
}
