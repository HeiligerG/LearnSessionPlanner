import { useCallback } from 'react';
import type { SessionResponse } from '@repo/shared-types';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/utils/localStorage';

const MAX_RECENT_SESSIONS = 10;

/**
 * Minimal session data for recent sessions list
 */
type RecentSession = Pick<
  SessionResponse,
  'id' | 'title' | 'description' | 'category' | 'scheduledFor' | 'tags'
>;

/**
 * Hook for managing recent sessions list
 * Stores up to 10 most recently viewed/edited sessions in localStorage
 */
export function useRecentSessions() {
  const [recentSessions, setRecentSessions, clearStorage] = useLocalStorage<RecentSession[]>(
    STORAGE_KEYS.RECENT_SESSIONS,
    []
  );

  /**
   * Add a session to the recent list
   * - Adds to the beginning of the list
   * - Removes duplicates by ID
   * - Trims to max 10 items
   */
  const addRecentSession = useCallback(
    (session: SessionResponse) => {
      setRecentSessions((prev) => {
        // Create minimal session object
        const recentSession: RecentSession = {
          id: session.id,
          title: session.title,
          description: session.description,
          category: session.category,
          scheduledFor: session.scheduledFor,
          tags: session.tags,
        };

        // Remove existing entry if present
        const filtered = prev.filter((s) => s.id !== session.id);

        // Add to beginning and trim to max
        return [recentSession, ...filtered].slice(0, MAX_RECENT_SESSIONS);
      });
    },
    [setRecentSessions]
  );

  /**
   * Clear all recent sessions
   */
  const clearRecentSessions = useCallback(() => {
    clearStorage();
  }, [clearStorage]);

  return {
    recentSessions,
    addRecentSession,
    clearRecentSessions,
  };
}
