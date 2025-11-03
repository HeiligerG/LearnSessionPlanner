import { useState, useMemo } from 'react';
import type { SessionResponse } from '@repo/shared-types';
import { formatDate, formatTime, getWeekDays } from '@/utils/dateUtils';
import { getStatusColor, getCategoryIcon, getSessionDuration } from '@/utils/sessionUtils';

interface WeekViewProps {
  sessions: SessionResponse[];
  onSessionClick?: (session: SessionResponse) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  selectedDate?: Date;
}

export function WeekView({
  sessions,
  onSessionClick,
  onTimeSlotClick,
  selectedDate = new Date()
}: WeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);

  // Get the 7 days of the current week
  const weekDays = useMemo(() => getWeekDays(currentWeek), [currentWeek]);

  // Time slots (6 AM to 11 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);

  // Group sessions by day
  const sessionsByDay = useMemo(() => {
    const grouped = new Map<string, SessionResponse[]>();

    weekDays.forEach(day => {
      const dayKey = day.toISOString().split('T')[0];
      grouped.set(dayKey, []);
    });

    sessions.forEach(session => {
      if (session.scheduledFor) {
        const sessionDate = new Date(session.scheduledFor);
        const dayKey = sessionDate.toISOString().split('T')[0];
        if (grouped.has(dayKey)) {
          grouped.get(dayKey)!.push(session);
        }
      }
    });

    return grouped;
  }, [sessions, weekDays]);

  // Get sessions for a specific time slot
  const getSessionsForSlot = (date: Date, hour: number) => {
    const dayKey = date.toISOString().split('T')[0];
    const daySessions = sessionsByDay.get(dayKey) || [];

    return daySessions.filter(session => {
      if (!session.scheduledFor) return false;
      const sessionDate = new Date(session.scheduledFor);
      const sessionHour = sessionDate.getHours();
      return sessionHour === hour;
    });
  };

  // Navigation handlers
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get current time indicator position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour < 6 || currentHour > 23) return null;

    const slotIndex = currentHour - 6;
    const minuteOffset = (currentMinute / 60) * 100;

    return {
      top: `${slotIndex * 60 + minuteOffset}px`,
      isVisible: weekDays.some(day => isToday(day))
    };
  };

  const currentTimePos = getCurrentTimePosition();

  // Format week range for header
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekRangeText = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {weekRangeText}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous week"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next week"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              Time
            </div>
            {weekDays.map((day, index) => {
              const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNumber = day.getDate();
              const isTodayDay = isToday(day);

              return (
                <div
                  key={index}
                  className={`p-2 text-center border-l border-gray-200 dark:border-gray-700 ${
                    isTodayDay ? 'bg-primary-50 dark:bg-primary-950' : ''
                  }`}
                >
                  <div className={`text-xs font-medium ${
                    isTodayDay ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {dayName}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${
                    isTodayDay ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {dayNumber}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="relative">
            {/* Current time indicator */}
            {currentTimePos && currentTimePos.isVisible && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                style={{ top: currentTimePos.top }}
              >
                <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            )}

            {timeSlots.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-700">
                {/* Time label */}
                <div className="p-2 text-xs text-gray-500 dark:text-gray-400 text-right pr-4">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>

                {/* Day columns */}
                {weekDays.map((day, dayIndex) => {
                  const slotSessions = getSessionsForSlot(day, hour);
                  const isTodayDay = isToday(day);

                  return (
                    <div
                      key={dayIndex}
                      className={`relative min-h-[60px] p-1 border-l border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        isTodayDay ? 'bg-primary-50/30 dark:bg-primary-950/30' : ''
                      }`}
                      onClick={() => onTimeSlotClick?.(day, hour)}
                    >
                      {slotSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionClick?.(session);
                          }}
                          className={`mb-1 p-1 rounded text-xs cursor-pointer hover:shadow-md transition-shadow border-l-2 ${
                            session.status === 'completed' ? 'border-l-green-500 bg-green-50 dark:bg-green-950' :
                            session.status === 'in_progress' ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-950' :
                            session.status === 'missed' ? 'border-l-red-500 bg-red-50 dark:bg-red-950' :
                            session.status === 'cancelled' ? 'border-l-gray-500 bg-gray-50 dark:bg-gray-800' :
                            'border-l-primary-500 bg-primary-50 dark:bg-primary-950'
                          }`}
                        >
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {getCategoryIcon(session.category)} {session.title}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 text-[10px]">
                            {formatTime(session.scheduledFor!)} • {getSessionDuration(session)}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
