import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import type {
  TemplateResponse,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFilters,
} from '@repo/shared-types'

export function useTemplates(initialFilters?: TemplateFilters) {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<TemplateFilters | undefined>(initialFilters)

  // Query for fetching templates
  const {
    data: templates = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['templates', filters],
    queryFn: async () => {
      const response = await api.templates.getAll(filters)
      const data = response.data?.data || []
      return Array.isArray(data) ? data : []
    },
  })

  // Mutation for creating a template
  const createTemplateMutation = useMutation({
    mutationFn: async (dto: CreateTemplateDto) => {
      const response = await api.templates.create(dto)
      return response.data
    },
    onMutate: async (newTemplate) => {
      await queryClient.cancelQueries({ queryKey: ['templates', filters] })

      const previousTemplates = queryClient.getQueryData<TemplateResponse[]>(['templates', filters])

      // Optimistically add template
      const tempId = `temp-${Date.now()}`
      const optimisticTemplate: TemplateResponse = {
        id: tempId,
        name: newTemplate.name,
        title: newTemplate.title,
        description: newTemplate.description || null,
        category: newTemplate.category,
        priority: newTemplate.priority || ('medium' as any),
        duration: newTemplate.duration,
        color: newTemplate.color || null,
        tags: newTemplate.tags || [],
        notes: newTemplate.notes || null,
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<TemplateResponse[]>(
        ['templates', filters],
        (old) => [optimisticTemplate, ...(old || [])]
      )

      return { previousTemplates }
    },
    onError: (err, newTemplate, context) => {
      queryClient.setQueryData(['templates', filters], context?.previousTemplates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  // Mutation for updating a template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTemplateDto }) => {
      const response = await api.templates.update(id, dto)
      return response.data
    },
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: ['templates', filters] })

      const previousTemplates = queryClient.getQueryData<TemplateResponse[]>(['templates', filters])

      // Optimistically update
      queryClient.setQueryData<TemplateResponse[]>(['templates', filters], (old) =>
        (old || []).map((template) =>
          template.id === id ? { ...template, ...dto } as TemplateResponse : template
        )
      )

      return { previousTemplates }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['templates', filters], context?.previousTemplates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  // Mutation for deleting a template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.templates.delete(id)
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['templates', filters] })

      const previousTemplates = queryClient.getQueryData<TemplateResponse[]>(['templates', filters])

      // Optimistically remove
      queryClient.setQueryData<TemplateResponse[]>(['templates', filters], (old) =>
        (old || []).filter((template) => template.id !== id)
      )

      return { previousTemplates }
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['templates', filters], context?.previousTemplates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  // Helper functions
  const createTemplate = async (dto: CreateTemplateDto) => {
    return createTemplateMutation.mutateAsync(dto)
  }

  const updateTemplate = async (id: string, dto: UpdateTemplateDto) => {
    return updateTemplateMutation.mutateAsync({ id, dto })
  }

  const deleteTemplate = async (id: string) => {
    return deleteTemplateMutation.mutateAsync(id)
  }

  const searchTemplates = async (query: string) => {
    try {
      const response = await api.templates.search(query)
      const data = response.data || []
      return Array.isArray(data) ? data : []
    } catch (err) {
      return []
    }
  }

  const updateFilters = (newFilters: Partial<TemplateFilters>) => {
    setFilters((prev) => ({ ...(prev || {}), ...newFilters }))
  }

  const fetchTemplates = () => {
    refetch()
  }

  return {
    templates,
    loading,
    error: error as Error | null,
    filters,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
    refetch,
    updateFilters,
  }
}
