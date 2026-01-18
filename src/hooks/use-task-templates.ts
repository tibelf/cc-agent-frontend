import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  TaskTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  ApplyTemplateRequest
} from '@/types'
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplate,
  applyTemplate,
  extractVariables,
  validateTemplate
} from '@/services/task-templates'

// Query Keys
export const TEMPLATE_QUERY_KEYS = {
  all: ['templates'] as const,
  lists: () => [...TEMPLATE_QUERY_KEYS.all, 'list'] as const,
  list: () => [...TEMPLATE_QUERY_KEYS.lists()] as const,
  details: () => [...TEMPLATE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TEMPLATE_QUERY_KEYS.details(), id] as const,
}

// 获取所有模版
export function useTaskTemplates() {
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: TEMPLATE_QUERY_KEYS.list(),
    queryFn: getTemplates,
    staleTime: 60000, // 1 minute
  })

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() })
    },
  })

  const applyMutation = useMutation({
    mutationFn: applyTemplate,
    onSuccess: () => {
      // 重新获取模版以更新使用次数
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() })
    },
  })

  // 兼容旧接口
  const create = async (request: CreateTemplateRequest): Promise<TaskTemplate> => {
    return createMutation.mutateAsync(request)
  }

  const update = async (request: UpdateTemplateRequest): Promise<TaskTemplate> => {
    return updateMutation.mutateAsync(request)
  }

  const remove = async (id: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  const getById = (id: string): TaskTemplate | null => {
    return templates.find(template => template.id === id) || null
  }

  const apply = async (request: ApplyTemplateRequest): Promise<string> => {
    return applyMutation.mutateAsync(request)
  }

  return {
    templates,
    isLoading,
    error,
    create,
    update,
    remove,
    getById,
    apply,
    reload: refetch,
    extractVariables,
    validateTemplate,
    // 暴露 mutations 供高级用法
    createMutation,
    updateMutation,
    deleteMutation,
    applyMutation,
  }
}

// 单独的Hook用于获取单个模版
export function useTaskTemplate(id: string, enabled: boolean = true) {
  const { data: template = null, isLoading, error } = useQuery({
    queryKey: TEMPLATE_QUERY_KEYS.detail(id),
    queryFn: () => getTemplate(id),
    enabled: enabled && !!id,
    staleTime: 30000, // 30 seconds
  })

  return {
    template,
    isLoading,
    error
  }
}

// 单独的创建模版 hook
export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() })
    },
  })
}

// 单独的更新模版 hook
export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() })
    },
  })
}

// 单独的删除模版 hook
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: TEMPLATE_QUERY_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() })
    },
  })
}

// 单独的应用模版 hook
export function useApplyTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: applyTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_QUERY_KEYS.lists() })
    },
  })
}

// 导出工具函数
export { extractVariables, validateTemplate }
