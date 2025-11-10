/**
 * Storage keys for localStorage
 */
export const STORAGE_KEYS = {
  DRAFT_SESSION: 'draft-session',
  RECENT_SESSIONS: 'recent-sessions',
  FAVORITE_SESSIONS: 'favorite-sessions',
  FAVORITE_TEMPLATES: 'favorite-templates',
} as const;

/**
 * Get an item from localStorage with type safety and error handling
 */
export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage (key: ${key}):`, error);
    return defaultValue;
  }
}

/**
 * Set an item in localStorage with error handling
 */
export function setItem(key: string, value: any): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Consider clearing old data.');
    } else {
      console.error(`Error writing to localStorage (key: ${key}):`, error);
    }
  }
}

/**
 * Remove an item from localStorage
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (key: ${key}):`, error);
  }
}

/**
 * Clear all items from localStorage
 */
export function clear(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}
