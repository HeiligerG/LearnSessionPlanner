import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/utils/localStorage';

/**
 * Hook for managing favorites (sessions and templates)
 * Stores favorite IDs as arrays in localStorage
 */
export function useFavorites() {
  const [favoriteSessionIds, setFavoriteSessionIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.FAVORITE_SESSIONS,
    []
  );

  const [favoriteTemplateIds, setFavoriteTemplateIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.FAVORITE_TEMPLATES,
    []
  );

  /**
   * Toggle a session favorite (add if not present, remove if present)
   */
  const toggleFavoriteSession = useCallback(
    (id: string) => {
      setFavoriteSessionIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((sessionId) => sessionId !== id);
        } else {
          return [...prev, id];
        }
      });
    },
    [setFavoriteSessionIds]
  );

  /**
   * Check if a session is favorited
   */
  const isFavoriteSession = useCallback(
    (id: string): boolean => {
      return favoriteSessionIds.includes(id);
    },
    [favoriteSessionIds]
  );

  /**
   * Toggle a template favorite (add if not present, remove if present)
   */
  const toggleFavoriteTemplate = useCallback(
    (id: string) => {
      setFavoriteTemplateIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((templateId) => templateId !== id);
        } else {
          return [...prev, id];
        }
      });
    },
    [setFavoriteTemplateIds]
  );

  /**
   * Check if a template is favorited
   */
  const isFavoriteTemplate = useCallback(
    (id: string): boolean => {
      return favoriteTemplateIds.includes(id);
    },
    [favoriteTemplateIds]
  );

  /**
   * Clear all favorites
   */
  const clearFavorites = useCallback(() => {
    setFavoriteSessionIds([]);
    setFavoriteTemplateIds([]);
  }, [setFavoriteSessionIds, setFavoriteTemplateIds]);

  return {
    favoriteSessionIds,
    favoriteTemplateIds,
    toggleFavoriteSession,
    isFavoriteSession,
    toggleFavoriteTemplate,
    isFavoriteTemplate,
    clearFavorites,
  };
}
