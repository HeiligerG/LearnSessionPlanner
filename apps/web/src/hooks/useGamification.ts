import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import type { GamificationSummaryDto } from '@repo/shared-types'

export interface UseGamificationReturn {
  gamification: GamificationSummaryDto | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Custom hook for fetching gamification data
 */
export function useGamification(): UseGamificationReturn {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      const response = await api.sessions.getGamification()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return {
    gamification: data,
    isLoading,
    error: error as Error | null,
    refetch,
  }
}
