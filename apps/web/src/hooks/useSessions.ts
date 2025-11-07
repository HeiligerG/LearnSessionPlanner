import { useState, useEffect, useCallback } from 'react';
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

  const fetchSessions = useCallback(async (filterOverride?: SessionFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.sessions.getAll(filterOverride || filters);
      // Extract sessions from the nested response structure
      const data = response.data?.data || [];
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sessions'));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createSession = useCallback(async (dto: CreateSessionDto) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.sessions.create(dto);
      const newSession = response.data;
      if (newSession) {
        setSessions((prev) => [newSession, ...prev]);
      }
      return newSession;
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
      const updatedSession = response.data;
      if (updatedSession) {
        setSessions((prev) =>
          prev.map((session) => (session.id === id ? updatedSession : session))
        );
      }
      return updatedSession;
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
      if (result && result.successful.length > 0) {
        setSessions((prev) => [...result.successful, ...prev]);
      }
      return result;
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
  }, [fetchSessions]);

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
