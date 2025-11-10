import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { SessionSuggestionDto } from '@repo/shared-types'

export interface UseSuggestionsReturn {
  suggestions: SessionSuggestionDto[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Custom hook for fetching session suggestions
 */
export function useSuggestions(): UseSuggestionsReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const response = await api.sessions.getSuggestions()
      return response.data || []
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  return {
    suggestions: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
