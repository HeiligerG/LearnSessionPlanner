import { useState, useEffect, useCallback } from 'react';
import * as storage from '@/utils/localStorage';

/**
 * Custom hook for managing localStorage state with React
 * Includes cross-tab synchronization and error handling
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      return storage.getItem<T>(key, initialValue);
    } catch (error) {
      console.error(`Error initializing localStorage state for key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        storage.setItem(key, valueToStore);

        // Dispatch storage event for cross-tab sync
        window.dispatchEvent(new StorageEvent('storage', {
          key,
          newValue: JSON.stringify(valueToStore),
          storageArea: localStorage,
        }));
      } catch (error) {
        console.error(`Error setting localStorage value for key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      storage.removeItem(key);
      setStoredValue(initialValue);

      // Dispatch storage event for cross-tab sync
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: null,
        storageArea: localStorage,
      }));
    } catch (error) {
      console.error(`Error removing localStorage value for key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === localStorage) {
        try {
          if (e.newValue === null) {
            setStoredValue(initialValue);
          } else {
            setStoredValue(JSON.parse(e.newValue));
          }
        } catch (error) {
          console.error(`Error handling storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
