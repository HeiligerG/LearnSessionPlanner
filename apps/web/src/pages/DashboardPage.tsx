import { useState, useEffect, useMemo } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { useRecentSessions } from '@/hooks/useRecentSessions';
import { useGamification } from '@/hooks/useGamification';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useToast } from '@/contexts/ToastContext';
import { useGlobalShortcuts } from '@/contexts/GlobalShortcutsContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionForm } from '@/components/sessions/SessionForm';
import { CalendarView } from '@/components/calendar/CalendarView';
import { KeyboardShortcutsHelp } from '@/components/common/KeyboardShortcutsHelp';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';
import { LevelProgress } from '@/components/gamification/LevelProgress';
import { AchievementCard } from '@/components/gamification/AchievementCard';
import { AchievementsModal } from '@/components/gamification/AchievementsModal';
import { SuggestionCard } from '@/components/suggestions/SuggestionCard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { BookOpen, Trophy, Lightbulb } from 'lucide-react';
import type { SessionResponse, SessionStatsDto, SessionSuggestionDto } from '@repo/shared-types';
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
  const { gamification, isLoading: gamificationLoading, refetch: refetchGamification } = useGamification();
  const { suggestions, isLoading: suggestionsLoading, refetch: refetchSuggestions } = useSuggestions();
  const toast = useToast();
  const { registerShortcut, unregisterShortcut } = useGlobalShortcuts();

  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);
  const [lastInteractedSession, setLastInteractedSession] = useState<SessionResponse | null>(null);
  const [stats, setStats] = useState<SessionStatsDto | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

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
            // Duplicate the session
            const duplicateDto = {
              title: lastInteractedSession.title,
              description: lastInteractedSession.description,
              category: lastInteractedSession.category,
              priority: lastInteractedSession.priority,
              duration: lastInteractedSession.duration,
              tags: lastInteractedSession.tags,
              notes: lastInteractedSession.notes,
              status: 'planned' as const,
            };

            createSession(duplicateDto)
              .then(() => {
                toast.success('Session duplicated successfully');
                setLastInteractedSession(null);
              })
              .catch((error) => {
                console.error('Failed to duplicate session:', error);
                toast.error('Failed to duplicate session');
              });
          } else {
            toast.warning('No session selected. Click a session first.');
          }
        },
      });
    }

    return () => {
      unregisterShortcut('duplicate-session');
    };
  }, [sessions.length, lastInteractedSession, registerShortcut, unregisterShortcut, createSession, toast]);

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

  // Suggestion handlers
  const handleAcceptSuggestion = async (suggestion: SessionSuggestionDto) => {
    try {
      await createSession({
        title: suggestion.suggestedTitle,
        category: suggestion.suggestedCategory,
        duration: suggestion.suggestedDuration,
        tags: suggestion.suggestedTags,
        priority: 'medium',
        status: 'planned',
      });
      toast.success('Session created from suggestion!');

      // Generate a unique key for this suggestion to track dismissal
      const suggestionKey = `${suggestion.suggestedTitle}-${suggestion.suggestedCategory}`;
      setDismissedSuggestions((prev) => new Set(prev).add(suggestionKey));

      // Refresh suggestions after accepting
      refetchSuggestions();
    } catch (error) {
      console.error('Failed to create session from suggestion:', error);
      toast.error('Failed to create session from suggestion');
    }
  };

  const handleDismissSuggestion = (suggestion: SessionSuggestionDto) => {
    const suggestionKey = `${suggestion.suggestedTitle}-${suggestion.suggestedCategory}`;
    setDismissedSuggestions((prev) => new Set(prev).add(suggestionKey));
  };

  // Filter out dismissed suggestions
  const visibleSuggestions = (suggestions || [])
    .filter((suggestion) => {
      const suggestionKey = `${suggestion.suggestedTitle}-${suggestion.suggestedCategory}`;
      return !dismissedSuggestions.has(suggestionKey);
    })
    .slice(0, 5);

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
        <div className="glass-card p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Sessions"
              value={stats.total}
              animateValue={true}
              glass={true}
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
              animateValue={true}
              glass={true}
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
              animateValue={true}
              glass={true}
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
        </div>
      )}

      {/* Gamification Section */}
      {gamification && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Your Progress
            </h2>
            <button
              onClick={() => setIsAchievementsOpen(true)}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
            >
              View All Achievements
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Level Progress */}
            <LevelProgress
              level={gamification.level}
              experiencePoints={gamification.experiencePoints}
              nextLevelThreshold={gamification.nextLevelThreshold}
            />

            {/* Streak Display */}
            <StreakDisplay
              currentStreak={gamification.currentStreak}
              longestStreak={gamification.longestStreak}
            />
          </div>

          {/* Recent Achievements */}
          {gamification.achievements.filter((a) => a.unlockedAt !== null).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Recent Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gamification.achievements
                  .filter((a) => a.unlockedAt !== null)
                  .sort(
                    (a, b) =>
                      new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
                  )
                  .slice(0, 3)
                  .map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      size="sm"
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions Section */}
      {visibleSuggestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Smart Suggestions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleSuggestions.map((suggestion, index) => (
              <SuggestionCard
                key={index}
                suggestion={suggestion}
                onAccept={handleAcceptSuggestion}
                onDismiss={handleDismissSuggestion}
              />
            ))}
          </div>
        </div>
      )}

      {/* View Toggle - Segmented Control */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 relative">
          <div
            className={`absolute top-1 bottom-1 bg-primary-600 rounded-full transition-all duration-300 ${
              view === 'calendar' ? 'left-1 w-[calc(50%-0.25rem)]' : 'left-[calc(50%+0.25rem)] w-[calc(50%-0.25rem)]'
            }`}
          />
          <button
            onClick={() => setView('calendar')}
            className={`relative px-6 py-2 rounded-full transition-colors min-h-[44px] z-10 ${
              view === 'calendar'
                ? 'text-white'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setView('list')}
            className={`relative px-6 py-2 rounded-full transition-colors min-h-[44px] z-10 ${
              view === 'list'
                ? 'text-white'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            List View
          </button>
        </div>
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
        <EmptyState
          icon={BookOpen}
          title="No sessions yet"
          description="Create your first learning session to get started"
          illustration="sessions"
          action={{
            label: 'Create First Session',
            onClick: () => {
              setSelectedSession(null);
              setShowSessionForm(true);
            },
          }}
        />
      ) : view === 'calendar' ? (
        <div className="glass-card p-6 rounded-lg animate-fade-in">
          <CalendarView
            sessions={sessions.filter(s => s != null)}
            onSessionClick={handleSessionClick}
            onDateClick={(date) => {
              setSelectedSession(null);
              setShowSessionForm(true);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {sessions.filter(s => s != null).map((session, index) => (
            <div key={session.id} className={`stagger-${Math.min(index + 1, 6)}`}>
              <SessionCard
                session={session}
                onEdit={handleEditSession}
                onDelete={handleDeleteSession}
                onClick={handleSessionClick}
                onDuplicate={handleDuplicateSession}
                onQuickUpdate={handleQuickUpdate}
              />
            </div>
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

      {/* Achievements Modal */}
      {gamification && (
        <AchievementsModal
          isOpen={isAchievementsOpen}
          onClose={() => setIsAchievementsOpen(false)}
          achievements={gamification.achievements}
        />
      )}
    </div>
  );
}
