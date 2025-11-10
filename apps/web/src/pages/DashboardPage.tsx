import { useState, useEffect, useMemo } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { useRecentSessions } from '@/hooks/useRecentSessions';
import { useToast } from '@/contexts/ToastContext';
import { useGlobalShortcuts } from '@/contexts/GlobalShortcutsContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionForm } from '@/components/sessions/SessionForm';
import { CalendarView } from '@/components/calendar/CalendarView';
import { KeyboardShortcutsHelp } from '@/components/common/KeyboardShortcutsHelp';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { Modal } from '@/components/common/Modal';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { SessionResponse, SessionStatsDto } from '@repo/shared-types';
import { api } from '@/services/api';

export default function DashboardPage() {
  const {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refetch,
  } = useSessions();

  const { addRecentSession } = useRecentSessions();
  const toast = useToast();
  const { registerShortcut, unregisterShortcut } = useGlobalShortcuts();

  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);
  const [lastInteractedSession, setLastInteractedSession] = useState<SessionResponse | null>(null);
  const [stats, setStats] = useState<SessionStatsDto | null>(null);

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    {
      key: 'n',
      description: 'Create new session',
      action: () => {
        setSelectedSession(null);
        setShowSessionForm(true);
      },
    },
    {
      key: 'c',
      description: 'Switch to calendar view',
      action: () => setView('calendar'),
    },
    {
      key: 'l',
      description: 'Switch to list view',
      action: () => setView('list'),
    },
    {
      key: 'r',
      description: 'Refresh data',
      action: () => refetch(),
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => setIsHelpOpen(prev => !prev),
    },
    {
      key: 'Escape',
      description: 'Close modals',
      action: () => {
        setShowSessionForm(false);
        setIsHelpOpen(false);
      },
    },
  ], [refetch]);

  useKeyboardShortcuts({ shortcuts });

  // Comment 1 & 2: Register Ctrl+D global shortcut for duplication
  useEffect(() => {
    if (sessions.length > 0) {
      registerShortcut('duplicate-session', {
        key: 'D',
        ctrlKey: true,
        description: 'Duplicate selected session',
        action: () => {
          if (lastInteractedSession) {
            handleDuplicateSession(lastInteractedSession);
            setLastInteractedSession(null);
          } else {
            toast.warning('No session selected. Click a session first.');
          }
        },
      });
    }

    return () => {
      unregisterShortcut('duplicate-session');
    };
  }, [sessions.length, lastInteractedSession, registerShortcut, unregisterShortcut]);

  useEffect(() => {
    // Fetch statistics
    api.sessions.getStats().then((response) => {
      if (response.data) {
        setStats(response.data);
      }
    }).catch(console.error);
  }, [sessions]);

  const handleCreateSession = async (data: any) => {
    try {
      await createSession(data);
      setShowSessionForm(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleUpdateSession = async (data: any) => {
    if (!selectedSession) return;
    try {
      await updateSession(selectedSession.id, data);
      setShowSessionForm(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const handleEditSession = (session: SessionResponse) => {
    // Comment 8: Add to recent sessions when editing
    addRecentSession(session);
    // Comment 1 & 2: Track last interacted session for Ctrl+D
    setLastInteractedSession(session);
    setSelectedSession(session);
    setShowSessionForm(true);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // Comment 6: Duplicate session handler
  const handleDuplicateSession = async (session: SessionResponse) => {
    try {
      // Copy all fields except id, timestamps, set status to 'planned', unset scheduledFor
      const duplicateDto = {
        title: session.title,
        description: session.description,
        category: session.category,
        priority: session.priority,
        duration: session.duration,
        tags: session.tags,
        notes: session.notes,
        status: 'planned' as const,
        // scheduledFor is intentionally omitted
      };

      await createSession(duplicateDto);
      toast.success('Session duplicated successfully');
    } catch (error) {
      console.error('Failed to duplicate session:', error);
      toast.error('Failed to duplicate session');
    }
  };

  // Comment 7: Quick update handler for one-click actions
  const handleQuickUpdate = async (id: string, patch: Partial<SessionResponse>) => {
    try {
      await updateSession(id, patch);
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  };

  const handleSessionClick = (session: SessionResponse) => {
    // Comment 1 & 2: Track last interacted session for Ctrl+D
    setLastInteractedSession(session);
    handleEditSession(session);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Learning Dashboard
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Plan and track your learning sessions
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedSession(null);
            setShowSessionForm(true);
          }}
          className="w-full sm:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm min-h-[44px]"
        >
          + New Session
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Sessions"
            value={stats.total}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            color="primary"
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            subtitle={`${stats.completionRate.toFixed(1)}% completion rate`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="success"
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            color="info"
          />
          <StatsCard
            title="Total Hours"
            value={`${(stats.completedDuration / 60).toFixed(1)}h`}
            subtitle={`of ${(stats.totalDuration / 60).toFixed(1)}h planned`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="warning"
          />
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setView('calendar')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            view === 'calendar'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Calendar View
        </button>
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            view === 'list'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          List View
        </button>
      </div>

      {/* Main Content */}
      {loading && !sessions.length ? (
        view === 'calendar' ? (
          <SkeletonLoader variant="calendar" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonLoader variant="card" count={6} />
          </div>
        )
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error loading sessions: {error.message}</p>
          <button
            onClick={refetch}
            className="mt-2 text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No sessions yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first learning session to get started
          </p>
          <button
            onClick={() => setShowSessionForm(true)}
            className="w-full sm:w-auto px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors min-h-[44px]"
          >
            Create First Session
          </button>
        </div>
      ) : view === 'calendar' ? (
        <CalendarView
          sessions={sessions.filter(s => s != null)}
          onSessionClick={handleSessionClick}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.filter(s => s != null).map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onEdit={handleEditSession}
              onDelete={handleDeleteSession}
              onClick={handleSessionClick}
              onDuplicate={handleDuplicateSession}
              onQuickUpdate={handleQuickUpdate}
            />
          ))}
        </div>
      )}

      {/* Session Form Modal */}
      <Modal
        isOpen={showSessionForm}
        onClose={() => {
          setShowSessionForm(false);
          setSelectedSession(null);
        }}
        title={selectedSession ? 'Edit Session' : 'Create New Session'}
        size="xl"
      >
        <SessionForm
          session={selectedSession || undefined}
          onSubmit={selectedSession ? handleUpdateSession : handleCreateSession}
          onCancel={() => {
            setShowSessionForm(false);
            setSelectedSession(null);
          }}
          loading={loading}
        />
      </Modal>

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
