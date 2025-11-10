import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import type {
  SessionResponse,
  CreateSessionDto,
  UpdateSessionDto,
  SessionFilters,
  BulkCreateSessionDto,
  BulkCreateResult,
} from '@repo/shared-types'

export function useSessions(initialFilters?: SessionFilters) {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<SessionFilters | undefined>(initialFilters)

  // Query for fetching sessions
  const {
    data: sessions = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sessions', filters],
    queryFn: async () => {
      const response = await api.sessions.getAll(filters)

      // Validate and normalize the response structure
      let sessionsData: SessionResponse[] = []

      if (response && typeof response === 'object') {
        if (Array.isArray(response.data)) {
          sessionsData = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          sessionsData = response.data.data
        } else if (Array.isArray(response)) {
          sessionsData = response
        }
      }

      // Validate each session object
      return sessionsData.filter(
        (session) =>
          session &&
          typeof session === 'object' &&
          session.id &&
          session.category &&
          session.status
      )
    },
  })

  // Mutation for creating a session
  const createSessionMutation = useMutation({
    mutationFn: async (dto: CreateSessionDto) => {
      const response = await api.sessions.create(dto)
      if (response && typeof response === 'object' && response.data) {
        return response.data
      }
      throw new Error('Invalid response format from session creation')
    },
    onMutate: async (newSession) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sessions', filters] })

      // Snapshot previous value
      const previousSessions = queryClient.getQueryData<SessionResponse[]>(['sessions', filters])

      // Optimistically update cache
      const tempId = `temp-${Date.now()}`
      const optimisticSession: SessionResponse = {
        id: tempId,
        title: newSession.title,
        description: newSession.description || null,
        category: newSession.category,
        status: newSession.status || ('planned' as any),
        priority: newSession.priority || ('medium' as any),
        duration: newSession.duration,
        actualDuration: null,
        color: newSession.color || null,
        tags: newSession.tags || [],
        notes: newSession.notes || null,
        scheduledFor: newSession.scheduledFor || null,
        startedAt: null,
        completedAt: null,
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Only add optimistically if it matches current filters
      const matchesFilters =
        (!filters?.category || optimisticSession.category === filters.category) &&
        (!filters?.status ||
          (Array.isArray(filters.status)
            ? filters.status.includes(optimisticSession.status)
            : filters.status === optimisticSession.status)) &&
        (!filters?.priority ||
          (Array.isArray(filters.priority)
            ? filters.priority.includes(optimisticSession.priority)
            : filters.priority === optimisticSession.priority))

      if (matchesFilters) {
        queryClient.setQueryData<SessionResponse[]>(
          ['sessions', filters],
          (old) => [optimisticSession, ...(old || [])]
        )
      }

      return { previousSessions }
    },
    onError: (err, newSession, context) => {
      // Rollback on error
      queryClient.setQueryData(['sessions', filters], context?.previousSessions)
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  // Mutation for updating a session
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateSessionDto }) => {
      const response = await api.sessions.update(id, dto)
      if (response && typeof response === 'object' && response.data) {
        return response.data
      }
      throw new Error('Invalid response format from session update')
    },
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: ['sessions', filters] })

      const previousSessions = queryClient.getQueryData<SessionResponse[]>(['sessions', filters])

      // Optimistically update
      queryClient.setQueryData<SessionResponse[]>(['sessions', filters], (old) =>
        (old || []).map((session) =>
          session.id === id ? { ...session, ...dto } as SessionResponse : session
        )
      )

      return { previousSessions }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['sessions', filters], context?.previousSessions)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  // Mutation for deleting a session
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.sessions.delete(id)
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['sessions', filters] })

      const previousSessions = queryClient.getQueryData<SessionResponse[]>(['sessions', filters])

      // Optimistically remove
      queryClient.setQueryData<SessionResponse[]>(['sessions', filters], (old) =>
        (old || []).filter((session) => session.id !== id)
      )

      return { previousSessions }
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['sessions', filters], context?.previousSessions)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  // Mutation for bulk creating sessions
  const bulkCreateSessionsMutation = useMutation({
    mutationFn: async (dto: BulkCreateSessionDto): Promise<BulkCreateResult> => {
      const response = await api.sessions.bulkCreate(dto)
      return response.data || { successful: [], failed: [], totalCreated: 0, totalFailed: 0 }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  // Helper functions
  const createSession = async (dto: CreateSessionDto) => {
    return createSessionMutation.mutateAsync(dto)
  }

  const updateSession = async (id: string, dto: UpdateSessionDto) => {
    return updateSessionMutation.mutateAsync({ id, dto })
  }

  const deleteSession = async (id: string) => {
    return deleteSessionMutation.mutateAsync(id)
  }

  const bulkCreateSessions = async (dto: BulkCreateSessionDto) => {
    return bulkCreateSessionsMutation.mutateAsync(dto)
  }

  const updateFilters = (newFilters: Partial<SessionFilters>) => {
    setFilters((prev) => ({ ...(prev || {}), ...newFilters }))
  }

  const fetchSessions = () => {
    refetch()
  }

  return {
    sessions,
    loading,
    error: error as Error | null,
    filters,
    fetchSessions,
    createSession,
    bulkCreateSessions,
    updateSession,
    deleteSession,
    refetch,
    updateFilters,
  }
}
