import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import type {
  SessionResponse,
  CreateSessionDto,
  UpdateSessionDto,
  SessionFilters,
  BulkCreateSessionDto,
  BulkCreateResult,
} from '@repo/shared-types';

export function useSessions(initialFilters?: SessionFilters) {
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<SessionFilters | undefined>(initialFilters);
  const filtersRef = useRef(filters);

  // Keep ref in sync with filters state
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchSessions = useCallback(async (filterOverride?: SessionFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.sessions.getAll(filterOverride || filtersRef.current);
      
      // Validate and normalize the response structure
      let sessionsData: SessionResponse[] = [];
      
      if (response && typeof response === 'object') {
        // Handle different possible response structures
        if (Array.isArray(response.data)) {
          sessionsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          sessionsData = response.data.data;
        } else if (Array.isArray(response)) {
          sessionsData = response;
        }
      }
      
      // Validate each session object
      const validatedSessions = sessionsData.filter(session => 
        session && 
        typeof session === 'object' && 
        session.id && 
        session.category && 
        session.status
      );
      
      setSessions(validatedSessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch sessions'));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (dto: CreateSessionDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.sessions.create(dto);
      
      // Handle API response structure: ApiResponse<SessionResponse>
      let newSession: SessionResponse | null = null;
      
      if (response && typeof response === 'object' && response.data) {
        // The response should be ApiResponse<SessionResponse> with data property
        newSession = response.data;
      }
      
      if (newSession) {
        setSessions((prev) => [newSession, ...prev]);
        return newSession;
      } else {
        throw new Error('Invalid response format from session creation');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create session'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (id: string, dto: UpdateSessionDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.sessions.update(id, dto);
      
      // Handle API response structure: ApiResponse<SessionResponse>
      let updatedSession: SessionResponse | null = null;
      
      if (response && typeof response === 'object' && response.data) {
        // The response should be ApiResponse<SessionResponse> with data property
        updatedSession = response.data;
      }
      
      if (updatedSession) {
        setSessions((prev) =>
          prev.map((session) => (session.id === id ? updatedSession! : session))
        );
        return updatedSession;
      } else {
        throw new Error('Invalid response format from session update');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update session'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.sessions.delete(id);
      setSessions((prev) => prev.filter((session) => session.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete session'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkCreateSessions = useCallback(async (dto: BulkCreateSessionDto): Promise<BulkCreateResult> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.sessions.bulkCreate(dto);
      const result = response.data;
      if (result && result.successful && result.successful.length > 0) {
        setSessions((prev) => [...result.successful, ...prev]);
      }
      return result || { successful: [], failed: [], totalCreated: 0, totalFailed: 0 };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to bulk create sessions'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchSessions();
  }, [fetchSessions]);

  const updateFilters = useCallback((newFilters: SessionFilters) => {
    setFilters(newFilters);
  }, []);

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return {
    sessions,
    loading,
    error,
    filters,
    fetchSessions,
    createSession,
    bulkCreateSessions,
    updateSession,
    deleteSession,
    refetch,
    updateFilters,
  };
}
