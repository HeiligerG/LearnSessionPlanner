import { useState, useRef } from 'react';
import type { SessionResponse } from '@repo/shared-types';
import { formatDate, formatTime } from '@/utils/dateUtils';
import {
  getStatusBadgeClasses,
  getPriorityBadgeClasses,
  getSessionDuration
} from '@/utils/sessionUtils';
import { getCategoryIconComponent } from '@/utils/iconUtils';
import { getCategoryStyle } from '@/utils/categoryStyles';
import { triggerCelebration } from '@/utils/animations';
import { useToastConfirm, useToast } from '@/contexts/ToastContext';
import { QuickActionMenu, type QuickAction } from '@/components/common/QuickActionMenu';
import { ProgressRing } from '@/components/common/ProgressRing';
import { Copy, Check, Calendar, MoreVertical } from 'lucide-react';

interface SessionCardProps {
  session: SessionResponse;
  onEdit?: (session: SessionResponse) => void;
  onDelete?: (id: string) => void;
  onClick?: (session: SessionResponse) => void;
  onDuplicate?: (session: SessionResponse) => void;
  onQuickUpdate?: (id: string, patch: Partial<SessionResponse>) => Promise<void>;
}

export function SessionCard({ session, onEdit, onDelete, onClick, onDuplicate, onQuickUpdate }: SessionCardProps) {
  const confirm = useToastConfirm();
  const toast = useToast();
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Guard against undefined or invalid session
  if (!session || typeof session !== 'object' || !session.id || !session.category || !session.status) {
    console.warn('SessionCard: Invalid session data', session);
    return (
      <div className="rounded-xl border-l-4 border-l-gray-300 bg-gray-50 dark:bg-gray-800 p-4 shadow-md">
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          Invalid session data
        </div>
      </div>
    );
  }

  // Calculate progress percentage if actualDuration exists
  const progressPercentage = session.actualDuration && session.duration
    ? Math.min((session.actualDuration / session.duration) * 100, 100)
    : 0;

  const handleDuplicate = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onDuplicate) {
      onDuplicate(session);
      // Toast is shown by the parent handler
    }
  };

  const handleMarkComplete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsLoading(true);
    // Comment 7: Use onQuickUpdate if available for one-click persist
    if (onQuickUpdate) {
      try {
        await onQuickUpdate(session.id, { status: 'completed' as const });
        toast.success('Session marked as complete');
        // Trigger celebration animation
        if (cardRef.current) {
          triggerCelebration(cardRef.current);
        }
      } catch (error) {
        toast.error('Failed to mark session complete');
      } finally {
        setIsLoading(false);
      }
    } else if (onEdit) {
      // Fallback to edit modal if no quick update
      setIsLoading(false);
      onEdit({ ...session, status: 'completed' as const });
    }
  };

  const handleReschedule = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // For simplicity, we'll just open the edit modal
    // A more sophisticated implementation could show a date picker
    if (onEdit) {
      onEdit(session);
    }
  };

  const quickActions: QuickAction[] = [
    {
      label: 'Duplicate',
      icon: <Copy className="w-5 h-5" />,
      onClick: handleDuplicate,
    },
    {
      label: 'Mark Complete',
      icon: <Check className="w-5 h-5" />,
      onClick: handleMarkComplete,
    },
    {
      label: 'Reschedule',
      icon: <Calendar className="w-5 h-5" />,
      onClick: handleReschedule,
    },
  ];

  const statusColor = session.status === 'completed' ? 'border-l-green-500' :
                      session.status === 'in_progress' ? 'border-l-blue-500' :
                      session.status === 'missed' ? 'border-l-red-500' :
                      session.status === 'cancelled' ? 'border-l-gray-500' :
                      'border-l-primary-500';

  const CategoryIcon = getCategoryIconComponent(session.category);
  const categoryStyle = getCategoryStyle(session.category);

  return (
    <div
      ref={cardRef}
      className={`group relative rounded-xl border-l-4 ${statusColor} overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] animate-slide-up`}
      onClick={() => onClick?.(session)}
    >
      {/* Category gradient overlay */}
      <div className={`absolute inset-0 ${categoryStyle.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

      {/* Glassmorphism card content */}
      <div className="relative glass-card p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 ${categoryStyle.iconBg} rounded-lg animate-scale-in group-hover:scale-110 transition-transform duration-300`}>
              <CategoryIcon className={`w-4 h-4 ${categoryStyle.iconColor}`} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {session.title}
            </h3>
            {progressPercentage > 0 && (
              <div className="ml-auto">
                <ProgressRing
                  progress={progressPercentage}
                  size={32}
                  strokeWidth={3}
                  color={progressPercentage >= 100 ? 'success' : 'primary'}
                  showPercentage={false}
                />
              </div>
            )}
          </div>

          {session.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {session.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={getStatusBadgeClasses(session.status)}>
              {session.status.replace('_', ' ')}
            </span>
            <span className={getPriorityBadgeClasses(session.priority)}>
              {session.priority}
            </span>
            {session.tags?.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {session.scheduledFor && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(session.scheduledFor)} {formatTime(session.scheduledFor)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{getSessionDuration(session)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickMenu(!showQuickMenu);
            }}
            className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 hover:scale-110 active:scale-95 rounded-lg touch-target ripple-on-click"
            title="More Actions (Ctrl+D for duplicate)"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(session);
              }}
              className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 hover:scale-110 active:scale-95 rounded-lg touch-target ripple-on-click"
              title="Edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const confirmed = await confirm('Are you sure you want to delete this session?');
                if (confirmed) {
                  onDelete(session.id);
                }
              }}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-110 active:scale-95 rounded-lg touch-target ripple-on-click"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Menu */}
      <QuickActionMenu
        isOpen={showQuickMenu}
        onClose={() => setShowQuickMenu(false)}
        actions={quickActions}
        anchorEl={menuButtonRef.current || undefined}
      />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400" />
        </div>
      )}
    </div>
  );
}
