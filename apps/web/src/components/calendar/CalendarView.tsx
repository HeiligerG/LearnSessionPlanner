import { useState, useMemo, useEffect, useRef } from 'react';
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
  const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = Math.max(0, index - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = Math.min(days.length - 1, index + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(0, index - 7);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(days.length - 1, index + 7);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onDateClick?.(days[index]);
        return;
      default:
        return;
    }

    setFocusedDayIndex(newIndex);
    // Focus the new cell
    const cells = gridRef.current?.querySelectorAll('[role="gridcell"]');
    if (cells && cells[newIndex]) {
      (cells[newIndex] as HTMLElement).focus();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {monthName}
        </h2>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={goToToday}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors min-h-[44px]"
            aria-label="Go to today"
          >
            Today
          </button>
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2" role="row">
        {[
          { short: 'S', full: 'Sunday' },
          { short: 'M', full: 'Monday' },
          { short: 'T', full: 'Tuesday' },
          { short: 'W', full: 'Wednesday' },
          { short: 'T', full: 'Thursday' },
          { short: 'F', full: 'Friday' },
          { short: 'S', full: 'Saturday' }
        ].map((day) => (
          <div
            key={day.full}
            className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 py-1 sm:py-2"
            role="columnheader"
            aria-label={day.full}
          >
            <span className="sm:hidden">{day.short}</span>
            <span className="hidden sm:inline">{day.full.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2" role="grid" ref={gridRef}>
        {days.map((date, i) => {
          const daySessions = getDaySessions(date);
          const isTodayDate = isToday(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const maxSessions = typeof window !== 'undefined' && window.innerWidth < 640 ? 2 : 3;

          return (
            <div
              key={i}
              role="gridcell"
              tabIndex={focusedDayIndex === i || (focusedDayIndex === null && isTodayDate) ? 0 : -1}
              onClick={() => onDateClick?.(date)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              aria-label={`${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${daySessions.length > 0 ? `, ${daySessions.length} session${daySessions.length !== 1 ? 's' : ''}` : ''}`}
              className={`
                min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border rounded-lg cursor-pointer transition-all
                ${isTodayDate ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-gray-200 dark:border-gray-700'}
                ${!isCurrentMonthDate ? 'opacity-40' : ''}
                hover:bg-gray-50 dark:hover:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800
              `}
            >
              <div className={`text-xs sm:text-sm font-semibold mb-1 ${isTodayDate ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {daySessions.slice(0, maxSessions).map((session) => (
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
                    role="button"
                    aria-label={`Session: ${session.title}`}
                  >
                    <span className={!session.color ? getStatusBadgeClasses(session.status) : 'text-white'}>
                      {session.title}
                    </span>
                  </div>
                ))}
                {daySessions.length > maxSessions && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                    +{daySessions.length - maxSessions} more
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
