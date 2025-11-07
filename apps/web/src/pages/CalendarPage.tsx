import { useSessions } from '@/hooks/useSessions';
import { CalendarView } from '@/components/calendar/CalendarView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { SessionForm } from '@/components/sessions/SessionForm';
import { useState } from 'react';
import type { SessionResponse } from '@repo/shared-types';

export default function CalendarPage() {
  const { sessions, loading, createSession, updateSession } = useSessions();
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Calendar
        </h1>
        <div className="flex items-center gap-4">
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
            onClick={() => {
              setSelectedSession(null);
              // Keep current selectedDate instead of resetting to today
              setShowSessionForm(true);
            }}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm"
          >
            + New Session
          </button>
        </div>
      </div>

      {loading && !sessions.length ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
