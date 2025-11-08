import { useSessions } from '@/hooks/useSessions';
import { CalendarView } from '@/components/calendar/CalendarView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { SessionForm } from '@/components/sessions/SessionForm';
import { BulkSessionForm } from '@/components/sessions/BulkSessionForm';
import { KeyboardShortcutsHelp } from '@/components/common/KeyboardShortcutsHelp';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useState, useMemo } from 'react';
import type { SessionResponse, BulkCreateSessionDto, BulkCreateResult, TemplateResponse } from '@repo/shared-types';

export default function CalendarPage() {
  const { sessions, loading, createSession, bulkCreateSessions, updateSession } = useSessions();
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkCreateResult | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');

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
      key: 'b',
      description: 'Bulk create sessions',
      action: () => setShowBulkForm(true),
    },
    {
      key: 'd',
      description: 'Switch to day view',
      action: () => {
        setViewMode('day');
        setSelectedDate(new Date());
      },
    },
    {
      key: 'w',
      description: 'Switch to week view',
      action: () => setViewMode('week'),
    },
    {
      key: 'm',
      description: 'Switch to month view',
      action: () => setViewMode('month'),
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
        setShowBulkForm(false);
        setIsHelpOpen(false);
      },
    },
  ], []);

  useKeyboardShortcuts({ shortcuts });

  const handleSessionClick = (session: SessionResponse) => {
    setSelectedSession(session);
    setShowSessionForm(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedSession(null);
    setShowSessionForm(true);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const slotDate = new Date(date);
    slotDate.setHours(hour, 0, 0, 0);
    setSelectedDate(slotDate);
    setSelectedSession(null);
    setShowSessionForm(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedSession) {
        await updateSession(selectedSession.id, data);
      } else {
        await createSession(data);
      }
      setShowSessionForm(false);
      setSelectedSession(null);
      // Keep selectedDate unchanged to preserve context
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const handleBulkSubmit = async (dto: BulkCreateSessionDto) => {
    try {
      const result = await bulkCreateSessions(dto);
      setBulkResult(result);
      setShowBulkForm(false);
      // Auto-dismiss after 5 seconds
      setTimeout(() => setBulkResult(null), 5000);
    } catch (error) {
      console.error('Failed to bulk create sessions:', error);
    }
  };

  const handleTemplateSaved = (template: TemplateResponse) => {
    console.log('Template saved:', template);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Calendar
        </h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          {/* View Toggle Buttons */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setViewMode('day');
                setSelectedDate(new Date());
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Month
            </button>
          </div>
          <button
            onClick={() => setShowBulkForm(true)}
            className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm min-h-[44px]"
          >
            Bulk Create
          </button>
          <button
            onClick={() => {
              setSelectedSession(null);
              // Keep current selectedDate instead of resetting to today
              setShowSessionForm(true);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm min-h-[44px]"
          >
            + New Session
          </button>
        </div>
      </div>

      {/* Bulk Result Notification */}
      {bulkResult && (
        <div className={`p-4 rounded-lg border ${
          bulkResult.totalFailed === 0
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={bulkResult.totalFailed === 0
                ? 'text-green-700 dark:text-green-300 font-medium'
                : 'text-yellow-700 dark:text-yellow-300 font-medium'
              }>
                Successfully created {bulkResult.totalCreated} session{bulkResult.totalCreated !== 1 ? 's' : ''}.
                {bulkResult.totalFailed > 0 && ` ${bulkResult.totalFailed} failed.`}
              </p>
            </div>
            <button
              onClick={() => setBulkResult(null)}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {loading && !sessions.length ? (
        <SkeletonLoader variant="calendar" />
      ) : (
        <>
          {viewMode === 'day' && (
            <DayView
              sessions={sessions}
              onSessionClick={handleSessionClick}
              onTimeSlotClick={handleTimeSlotClick}
              selectedDate={selectedDate}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              sessions={sessions}
              onSessionClick={handleSessionClick}
              onTimeSlotClick={handleTimeSlotClick}
              selectedDate={selectedDate}
            />
          )}
          {viewMode === 'month' && (
            <CalendarView
              sessions={sessions}
              onSessionClick={handleSessionClick}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
            />
          )}
        </>
      )}

      {showSessionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedSession ? 'Edit Session' : 'Create New Session'}
              </h2>
              <SessionForm
                session={selectedSession || undefined}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowSessionForm(false);
                  setSelectedSession(null);
                  // Keep selectedDate unchanged to preserve context
                }}
                loading={loading}
                initialDate={selectedDate}
                onTemplateSaved={handleTemplateSaved}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Session Form Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Bulk Create Sessions
                </h2>
                <button
                  onClick={() => {
                    setShowBulkForm(false);
                    setBulkResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <BulkSessionForm
                onSubmit={handleBulkSubmit}
                onCancel={() => {
                  setShowBulkForm(false);
                  setBulkResult(null);
                }}
                loading={loading}
                initialDate={selectedDate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
