import { useState, useMemo, useEffect } from 'react';
import type { SessionResponse } from '@repo/shared-types';
import { getMonthDays, formatDate } from '@/utils/dateUtils';
import { groupSessionsByDate, getStatusBadgeClasses } from '@/utils/sessionUtils';

interface CalendarViewProps {
  sessions: SessionResponse[];
  onSessionClick?: (session: SessionResponse) => void;
  onDateClick?: (date: Date) => void;
  selectedDate?: Date;
}

export function CalendarView({ sessions, onSessionClick, onDateClick, selectedDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  // Sync currentDate with selectedDate prop changes
  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

  const days = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const sessionsByDate = useMemo(() => groupSessionsByDate(sessions), [sessions]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaySessions = (date: Date) => {
    // Format date to match the format used in groupSessionsByDate
    const key = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return sessionsByDate[key] || [];
  };

  const isToday = (date: Date) => {
    return date.getTime() === today.getTime();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {monthName}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            Today
          </button>
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, i) => {
          const daySessions = getDaySessions(date);
          const isTodayDate = isToday(date);
          const isCurrentMonthDate = isCurrentMonth(date);

          return (
            <div
              key={i}
              onClick={() => onDateClick?.(date)}
              className={`
                min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                ${isTodayDate ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-gray-200 dark:border-gray-700'}
                ${!isCurrentMonthDate ? 'opacity-40' : ''}
                hover:bg-gray-50 dark:hover:bg-gray-700
              `}
            >
              <div className={`text-sm font-semibold mb-1 ${isTodayDate ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {daySessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSessionClick?.(session);
                    }}
                    className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: session.color || undefined,
                    }}
                    title={session.title}
                  >
                    <span className={!session.color ? getStatusBadgeClasses(session.status) : 'text-white'}>
                      {session.title}
                    </span>
                  </div>
                ))}
                {daySessions.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                    +{daySessions.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
