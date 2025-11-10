import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Search,
  Filter,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  /** Icon component to display */
  icon: LucideIcon;
  /** Main title */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Optional illustration type */
  illustration?: 'sessions' | 'search' | 'filter' | 'calendar';
}

/**
 * Reusable empty state component with friendly illustrations
 */
export function EmptyState({ icon: Icon, title, description, action, illustration }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      {/* Illustration */}
      {illustration && <Illustration type={illustration} />}

      {/* Icon */}
      {!illustration && (
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-xl opacity-50 animate-pulse-subtle" />
          <Icon className="relative w-16 h-16 text-gray-400 dark:text-gray-500 animate-bounce-subtle" />
        </div>
      )}

      {/* Content */}
      <div className="text-center max-w-md space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick} variant="primary" size="lg">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Creative SVG illustrations using lucide-react icons
 */
function Illustration({ type }: { type: NonNullable<EmptyStateProps['illustration']> }) {
  if (type === 'sessions') {
    return (
      <div className="relative w-48 h-48 mb-6">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/20 dark:to-purple-900/20 rounded-full blur-2xl opacity-50" />

        {/* Icons arranged in triangular layout */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 animate-bounce-subtle" style={{ animationDelay: '0ms' }}>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg shadow-lg">
              <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="absolute bottom-8 left-8 animate-bounce-subtle" style={{ animationDelay: '200ms' }}>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg shadow-lg">
              <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="absolute bottom-8 right-8 animate-bounce-subtle" style={{ animationDelay: '400ms' }}>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg shadow-lg">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Connecting lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <line x1="50%" y1="30%" x2="25%" y2="70%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="50%" y1="30%" x2="75%" y2="70%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="25%" y1="70%" x2="75%" y2="70%" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        </div>
      </div>
    );
  }

  if (type === 'search') {
    return (
      <div className="relative w-48 h-48 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full blur-2xl opacity-50" />

        <div className="relative w-full h-full flex items-center justify-center">
          <div className="animate-pulse-subtle">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
              <Search className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <Sparkles className="absolute top-4 right-4 w-6 h-6 text-yellow-500 animate-ping" />
          <Sparkles className="absolute bottom-4 left-4 w-4 h-4 text-yellow-500 animate-ping" style={{ animationDelay: '1s' }} />
        </div>
      </div>
    );
  }

  if (type === 'filter') {
    return (
      <div className="relative w-48 h-48 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-2xl opacity-50" />

        <div className="relative w-full h-full flex items-center justify-center">
          <div className="animate-bounce-subtle">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
              <Filter className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-white text-xs font-bold">0</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'calendar') {
    return (
      <div className="relative w-48 h-48 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full blur-2xl opacity-50" />

        <div className="relative w-full h-full flex items-center justify-center">
          <div className="animate-bounce-subtle">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
              <Calendar className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          {/* Mini floating dates */}
          <div className="absolute top-0 right-8 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 animate-float" style={{ animationDelay: '0ms' }}>
            15
          </div>
          <div className="absolute bottom-0 left-8 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-md flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 animate-float" style={{ animationDelay: '500ms' }}>
            23
          </div>
        </div>
      </div>
    );
  }

  return null;
}
