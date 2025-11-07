import { useState, useEffect } from 'react';
import type { SessionResponse } from '@repo/shared-types';
import { formatTime } from '@/utils/dateUtils';
import { getCategoryIconComponent } from '@/utils/iconUtils';
import { getSessionDuration } from '@/utils/sessionUtils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayViewProps {
  sessions: SessionResponse[];
  onSessionClick: (session: SessionResponse) => void;
  onTimeSlotClick: (date: Date, hour: number) => void;
  selectedDate?: Date;
}

export function DayView({ sessions, onSessionClick, onTimeSlotClick, selectedDate = new Date() }: DayViewProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  // Sync currentDate with selectedDate prop changes
  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getSessionsForHour = (hour: number) => {
    return sessions.filter(session => {
      if (!session.scheduledFor) return false;
      const sessionDate = new Date(session.scheduledFor);
      const sessionHour = sessionDate.getHours();

      // Check if session is on the current date and starts in this hour
      return sessionDate.toDateString() === currentDate.toDateString() && sessionHour === hour;
    });
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();
  const currentHour = new Date().getHours();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'in_progress':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'missed':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'cancelled':
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'border-l-primary-500 bg-primary-50 dark:bg-primary-900/20';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousDay}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Day Schedule */}
      <div className="p-4 overflow-y-auto max-h-[calc(100vh-300px)]">
        <div className="space-y-1">
          {hours.map((hour) => {
            const hourSessions = getSessionsForHour(hour);
            const isCurrentHour = isToday && currentHour === hour;

            // Calculate minute-accurate position for current time indicator
            let minuteOffset = 0;
            if (isCurrentHour) {
              const currentMinutes = new Date().getMinutes();
              minuteOffset = (currentMinutes / 60) * 80; // 80px is the min-height of each hour slot
            }

            return (
              <div key={hour} className="relative">
                {/* Current time indicator with minute-accurate positioning */}
                {isCurrentHour && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                    style={{ top: `${minuteOffset}px` }}
                  >
                    <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                )}

                <div className="flex gap-4 min-h-[80px]">
                  {/* Time label */}
                  <div className="w-20 flex-shrink-0 pt-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </span>
                  </div>

                  {/* Time slot */}
                  <div className="flex-1">
                    <div
                      onClick={() => {
                        const slotDate = new Date(currentDate);
                        slotDate.setHours(hour, 0, 0, 0);
                        onTimeSlotClick(slotDate, hour);
                      }}
                      className="min-h-[80px] border border-gray-200 dark:border-gray-700 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      {hourSessions.length > 0 ? (
                        <div className="space-y-2">
                          {hourSessions.map((session) => {
                            const CategoryIcon = getCategoryIconComponent(session.category);
                            const statusColor = getStatusColor(session.status);

                            return (
                              <div
                                key={session.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSessionClick(session);
                                }}
                                className={`border-l-4 ${statusColor} rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900 rounded">
                                    <CategoryIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                      {session.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                                      <span>{formatTime(session.scheduledFor!)}</span>
                                      <span>•</span>
                                      <span>{getSessionDuration(session)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
                          Click to add session
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
