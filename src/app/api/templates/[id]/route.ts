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

// GET /api/templates/[id] - 获取单个模版
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await readTemplates()
    const template = data.templates.find(t => t.id === id)

    if (!template) {
      return NextResponse.json(
        { success: false, error: '模版不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template
    })
  } catch (error) {
    console.error('Error reading template:', error)
    return NextResponse.json(
      { success: false, error: '读取模版失败' },
      { status: 500 }
    )
  }
}

// PUT /api/templates/[id] - 更新模版
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = await readTemplates()
    const index = data.templates.findIndex(t => t.id === id)

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: '模版不存在' },
        { status: 404 }
      )
    }

    // 更新模版字段
    const updatedTemplate: Template = {
      ...data.templates[index],
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.prompt_template !== undefined && { prompt_template: body.prompt_template }),
      ...(body.variables !== undefined && { variables: body.variables }),
      ...(body.usage_count !== undefined && { usage_count: body.usage_count })
    }

    data.templates[index] = updatedTemplate
    await writeTemplates(data)

    return NextResponse.json({
      success: true,
      data: updatedTemplate
    })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { success: false, error: '更新模版失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id] - 删除模版
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await readTemplates()
    const index = data.templates.findIndex(t => t.id === id)

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: '模版不存在' },
        { status: 404 }
      )
    }

    data.templates.splice(index, 1)
    await writeTemplates(data)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, error: '删除模版失败' },
      { status: 500 }
    )
  }
}
