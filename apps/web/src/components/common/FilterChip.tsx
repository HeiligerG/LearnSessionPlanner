import type { ReactNode } from 'react';
import { getCategoryStyle } from '@/utils/categoryStyles';
import type { SessionCategory } from '@repo/shared-types';

interface FilterChipProps {
  /** Chip label */
  label: string;
  /** Chip value */
  value: string;
  /** Whether chip is active/selected */
  isActive: boolean;
  /** Optional icon to display */
  icon?: ReactNode;
  /** Toggle handler */
  onToggle: (value: string) => void;
  /** Chip variant */
  variant?: 'default' | 'category' | 'status' | 'priority';
}

/**
 * Interactive chip component for filtering
 */
export function FilterChip({
  label,
  value,
  isActive,
  icon,
  onToggle,
  variant = 'default',
}: FilterChipProps) {
  const handleClick = () => {
    onToggle(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(value);
    }
  };

  // Get styling based on variant and active state
  const getChipClasses = () => {
    const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer min-h-[44px] touch-target select-none';

    if (isActive) {
      if (variant === 'category') {
        // Use category gradient for active category chips
        const categoryStyle = getCategoryStyle(value as SessionCategory);
        return `${baseClasses} ${categoryStyle.gradient} text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95`;
      }

      if (variant === 'status') {
        const statusColors: Record<string, string> = {
          planned: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
          in_progress: 'bg-gradient-to-br from-blue-500 to-blue-700',
          completed: 'bg-gradient-to-br from-green-500 to-green-700',
          missed: 'bg-gradient-to-br from-red-500 to-red-700',
          cancelled: 'bg-gradient-to-br from-gray-500 to-gray-700',
        };
        const gradient = statusColors[value] || statusColors.planned;
        return `${baseClasses} ${gradient} text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95`;
      }

      if (variant === 'priority') {
        const priorityColors: Record<string, string> = {
          low: 'bg-gradient-to-br from-gray-500 to-gray-700',
          medium: 'bg-gradient-to-br from-blue-500 to-blue-700',
          high: 'bg-gradient-to-br from-orange-500 to-orange-700',
          urgent: 'bg-gradient-to-br from-red-500 to-red-700',
        };
        const gradient = priorityColors[value] || priorityColors.medium;
        return `${baseClasses} ${gradient} text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95`;
      }

      // Default active state
      return `${baseClasses} bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95`;
    }

    // Inactive state
    return `${baseClasses} bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105 active:scale-95 border border-gray-200 dark:border-gray-700`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={getChipClasses()}
      role="checkbox"
      aria-checked={isActive}
      aria-label={`Filter by ${label}`}
      tabIndex={0}
    >
      {icon && (
        <span className="flex-shrink-0 flex items-center justify-center">
          {icon}
        </span>
      )}
      <span className="whitespace-nowrap">{label}</span>
      {isActive && (
        <svg
          className="w-4 h-4 ml-1 animate-scale-in"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * Container for filter chips with horizontal scrolling
 */
export function FilterChipGroup({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {children}
      </div>
      {/* Fade edges for scroll hint */}
      <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-white dark:from-gray-900 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
    </div>
  );
}
