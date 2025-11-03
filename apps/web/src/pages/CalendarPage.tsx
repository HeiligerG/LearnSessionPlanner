import { useSessions } from '@/hooks/useSessions';
import { CalendarView } from '@/components/calendar/CalendarView';
import { SessionForm } from '@/components/sessions/SessionForm';
import { useState } from 'react';
import type { SessionResponse } from '@repo/shared-types';

export default function CalendarPage() {
  const { sessions, loading, createSession, updateSession } = useSessions();
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleSessionClick = (session: SessionResponse) => {
    setSelectedSession(session);
    setShowSessionForm(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedSession(null);
    setShowSessionForm(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedSession) {
        await updateSession(selectedSession.id, data);
      } else {
        // If a date was selected, set scheduledFor to that date
        if (selectedDate && !data.scheduledFor) {
          const dateStr = selectedDate.toISOString().split('T')[0];
          data.scheduledFor = `${dateStr}T10:00:00`;
        }
        await createSession(data);
      }
      setShowSessionForm(false);
      setSelectedSession(null);
      setSelectedDate(null);
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
        <button
          onClick={() => {
            setSelectedSession(null);
            setSelectedDate(null);
            setShowSessionForm(true);
          }}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-sm"
        >
          + New Session
        </button>
      </div>

      {loading && !sessions.length ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <CalendarView
          sessions={sessions}
          onSessionClick={handleSessionClick}
          onDateClick={handleDateClick}
        />
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
                  setSelectedDate(null);
                }}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
