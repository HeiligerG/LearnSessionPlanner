import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

interface GlobalShortcutsContextType {
  registerShortcut: (id: string, shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  getShortcuts: () => KeyboardShortcut[];
}

const GlobalShortcutsContext = createContext<GlobalShortcutsContextType | undefined>(undefined);

export function GlobalShortcutsProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Map<string, KeyboardShortcut>>(new Map());

  const registerShortcut = useCallback((id: string, shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      const newMap = new Map(prev);

      // Warn if shortcut already exists
      if (newMap.has(id)) {
        console.warn(`Global shortcut with id "${id}" is being overridden`);
      }

      // Check for conflicts
      for (const [existingId, existingShortcut] of newMap.entries()) {
        if (
          existingShortcut.key === shortcut.key &&
          existingShortcut.ctrlKey === shortcut.ctrlKey &&
          existingShortcut.shiftKey === shortcut.shiftKey &&
          existingShortcut.altKey === shortcut.altKey &&
          existingShortcut.metaKey === shortcut.metaKey
        ) {
          console.warn(
            `Global shortcut conflict: "${id}" has the same key combination as "${existingId}"`
          );
        }
      }

      newMap.set(id, shortcut);
      return newMap;
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const getShortcuts = useCallback((): KeyboardShortcut[] => {
    return Array.from(shortcuts.values());
  }, [shortcuts]);

  // Use the keyboard shortcuts hook to listen to all registered shortcuts
  useKeyboardShortcuts({
    shortcuts: Array.from(shortcuts.values()),
    enabled: true,
  });

  return (
    <GlobalShortcutsContext.Provider value={{ registerShortcut, unregisterShortcut, getShortcuts }}>
      {children}
    </GlobalShortcutsContext.Provider>
  );
}

export function useGlobalShortcuts() {
  const context = useContext(GlobalShortcutsContext);
  if (!context) {
    throw new Error('useGlobalShortcuts must be used within a GlobalShortcutsProvider');
  }
  return context;
}
