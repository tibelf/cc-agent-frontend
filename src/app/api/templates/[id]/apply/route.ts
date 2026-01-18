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

// POST /api/templates/[id]/apply - 应用模版
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { variables } = body

    if (!variables || typeof variables !== 'object') {
      return NextResponse.json(
        { success: false, error: '变量参数无效' },
        { status: 400 }
      )
    }

    const data = await readTemplates()
    const index = data.templates.findIndex(t => t.id === id)

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: '模版不存在' },
        { status: 404 }
      )
    }

    const template = data.templates[index]

    // 渲染模版
    let rendered = template.prompt_template
    for (const [varName, varValue] of Object.entries(variables)) {
      const placeholder = `{{${varName}}}`
      rendered = rendered.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), String(varValue))
    }

    // 增加使用次数
    data.templates[index] = {
      ...template,
      usage_count: template.usage_count + 1
    }
    await writeTemplates(data)

    return NextResponse.json({
      success: true,
      data: { rendered }
    })
  } catch (error) {
    console.error('Error applying template:', error)
    return NextResponse.json(
      { success: false, error: '应用模版失败' },
      { status: 500 }
    )
  }
}
