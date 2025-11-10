import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface QuickActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  actions: QuickAction[];
  anchorEl?: HTMLElement;
}

export function QuickActionMenu({ isOpen, onClose, actions, anchorEl }: QuickActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position relative to anchor element
  useEffect(() => {
    if (isOpen && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const menuHeight = 200; // Approximate max height
      const menuWidth = 200;

      let top = rect.bottom + 8;
      let left = rect.left;

      // Adjust if menu would go off bottom of screen
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 8;
      }

      // Adjust if menu would go off right of screen
      if (left + menuWidth > window.innerWidth) {
        left = rect.right - menuWidth;
      }

      setPosition({ top, left });
    }
  }, [isOpen, anchorEl]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % actions.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + actions.length) % actions.length);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          actions[focusedIndex]?.onClick();
          onClose();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, actions, focusedIndex, onClose]);

  // Focus first item when opened
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const menu = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 animate-scale-in"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        role="menu"
        aria-orientation="vertical"
      >
        <div className="py-1">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              onMouseEnter={() => setFocusedIndex(index)}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm
                transition-colors
                ${
                  action.variant === 'danger'
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                ${focusedIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''}
              `}
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
            >
              <span className="w-5 h-5 flex-shrink-0">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return createPortal(menu, document.body);
}
