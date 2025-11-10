import type {
  SessionResponse,
  SessionStatus,
  SessionPriority,
  SessionCategory,
  SessionFilters,
} from '@repo/shared-types';

/**
 * Get Tailwind color class for session status
 */
export function getStatusColor(status: SessionStatus): string {
  const colors = {
    planned: 'indigo',
    in_progress: 'blue',
    completed: 'green',
    missed: 'red',
    cancelled: 'gray',
  };
  return colors[status as keyof typeof colors] || 'gray';
}

/**
 * Get Tailwind color class for priority
 */
export function getPriorityColor(priority: SessionPriority): string {
  const colors = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red',
  };
  return colors[priority as keyof typeof colors] || 'gray';
}

/**
 * Get status badge classes
 */
export function getStatusBadgeClasses(status: SessionStatus): string {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const statusClasses = {
    planned: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    missed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  return `${baseClasses} ${statusClasses[status as keyof typeof statusClasses] || statusClasses.planned}`;
}

/**
 * Get priority badge classes
 */
export function getPriorityBadgeClasses(priority: SessionPriority): string {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';

  const priorityClasses = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  };

  return `${baseClasses} ${priorityClasses[priority as keyof typeof priorityClasses] || priorityClasses.medium}`;
}

/**
 * Get category icon (deprecated - use getCategoryIconComponent from iconUtils instead)
 * @deprecated Use getCategoryIconComponent from @/utils/iconUtils
 */
export function getCategoryIcon(category: SessionCategory): string {
  const icons = {
    school: '📚',
    programming: '💻',
    language: '🗣️',
    personal: '🎯',
    other: '📝',
  };
  return icons[category as keyof typeof icons] || '📝';
}

/**
 * Check if session is overdue
 */
export function isSessionOverdue(session: SessionResponse): boolean {
  if (!session.scheduledFor) return false;
  if (session.status === 'completed' || session.status === 'cancelled') return false;

  return new Date(session.scheduledFor) < new Date();
}

/**
 * Check if session is scheduled for today
 */
export function isSessionToday(session: SessionResponse): boolean {
  if (!session.scheduledFor) return false;

  const scheduled = new Date(session.scheduledFor);
  const today = new Date();

  return scheduled.getDate() === today.getDate() &&
    scheduled.getMonth() === today.getMonth() &&
    scheduled.getFullYear() === today.getFullYear();
}

/**
 * Check if session is upcoming
 */
export function isSessionUpcoming(session: SessionResponse): boolean {
  if (!session.scheduledFor) return false;
  if (session.status === 'completed' || session.status === 'cancelled') return false;

  return new Date(session.scheduledFor) > new Date();
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(sessions: SessionResponse[]): number {
  if (sessions.length === 0) return 0;

  const completed = sessions.filter(s => s.status === 'completed').length;
  return Math.round((completed / sessions.length) * 100);
}

/**
 * Group sessions by date
 */
export function groupSessionsByDate(sessions: SessionResponse[]): Record<string, SessionResponse[]> {
  const grouped: Record<string, SessionResponse[]> = {};

  // Validate input
  if (!Array.isArray(sessions)) {
    console.warn('groupSessionsByDate: sessions is not an array', sessions);
    return grouped;
  }

  sessions.forEach(session => {
    // Skip undefined or invalid sessions
    if (!session || typeof session !== 'object' || !session.category || !session.status) {
      console.warn('groupSessionsByDate: skipping invalid session', session);
      return;
    }

    try {
      if (!session.scheduledFor) {
        const key = 'Unscheduled';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(session);
      } else {
        const date = new Date(session.scheduledFor);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('groupSessionsByDate: invalid date for session', session.scheduledFor, session);
          const key = 'Invalid Date';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(session);
        } else {
          // Format as readable date: "Nov 3, 2025"
          const key = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(session);
        }
      }
    } catch (error) {
      console.error('groupSessionsByDate: error processing session', session, error);
      const key = 'Error';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(session);
    }
  });

  return grouped;
}

/**
 * Group sessions by status
 */
export function groupSessionsByStatus(sessions: SessionResponse[]): Record<SessionStatus, SessionResponse[]> {
  const grouped: Record<string, SessionResponse[]> = {
    planned: [],
    in_progress: [],
    completed: [],
    missed: [],
    cancelled: [],
  };

  sessions.forEach(session => {
    // Skip undefined or invalid sessions
    if (!session || !session.status) return;

    grouped[session.status]?.push(session);
  });

  return grouped as Record<SessionStatus, SessionResponse[]>;
}

/**
 * Filter sessions
 */
export function filterSessions(sessions: SessionResponse[], filters: SessionFilters): SessionResponse[] {
  // Validate input
  if (!Array.isArray(sessions)) {
    console.warn('filterSessions: sessions is not an array', sessions);
    return [];
  }

  return sessions.filter(session => {
    // Skip undefined or invalid sessions
    if (!session || typeof session !== 'object' || !session.category || !session.status) {
      console.warn('filterSessions: skipping invalid session', session);
      return false;
    }

    try {
      // Category filter
      if (filters?.category && session.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        if (!statuses.includes(session.status)) return false;
      }

      // Priority filter
      if (filters?.priority) {
        const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
        if (!priorities.includes(session.priority)) return false;
      }

      // Tags filter
      if (filters?.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
        const sessionTags = Array.isArray(session.tags) ? session.tags : [];
        const hasTag = filters.tags.some(tag => sessionTags.includes(tag));
        if (!hasTag) return false;
      }

      // Date range filter
      if (filters?.scheduledFrom || filters?.scheduledTo) {
        if (!session.scheduledFor) return false;

        try {
          const scheduledDate = new Date(session.scheduledFor);
          if (isNaN(scheduledDate.getTime())) {
            console.warn('filterSessions: invalid date for session', session.scheduledFor, session);
            return false;
          }

          if (filters.scheduledFrom) {
            const fromDate = new Date(filters.scheduledFrom);
            if (isNaN(fromDate.getTime())) {
              console.warn('filterSessions: invalid scheduledFrom date', filters.scheduledFrom);
            } else if (scheduledDate < fromDate) {
              return false;
            }
          }

          if (filters.scheduledTo) {
            const toDate = new Date(filters.scheduledTo);
            if (isNaN(toDate.getTime())) {
              console.warn('filterSessions: invalid scheduledTo date', filters.scheduledTo);
            } else if (scheduledDate > toDate) {
              return false;
            }
          }
        } catch (dateError) {
          console.error('filterSessions: error processing date filter', dateError);
          return false;
        }
      }

      // Search filter
      if (filters?.search && typeof filters.search === 'string') {
        const searchLower = filters.search.toLowerCase();
        const title = session.title || '';
        const description = session.description || '';
        const notes = session.notes || '';

        const matchesTitle = title.toLowerCase().includes(searchLower);
        const matchesDescription = description.toLowerCase().includes(searchLower);
        const matchesNotes = notes.toLowerCase().includes(searchLower);

        if (!matchesTitle && !matchesDescription && !matchesNotes) {
          return false;
        }
      }
    } catch (error) {
      console.error('filterSessions: error filtering session', session, error);
      return false;
    }

    return true;
  });
}

/**
 * Sort sessions
 */
export function sortSessions(
  sessions: SessionResponse[],
  sortBy: string,
  order: 'asc' | 'desc' = 'desc'
): SessionResponse[] {
  const sorted = [...sessions].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortBy === 'scheduledFor') {
      aValue = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
      bValue = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
    } else if (sortBy === 'createdAt') {
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      aValue = priorityOrder[a.priority];
      bValue = priorityOrder[b.priority];
    } else {
      aValue = (a as any)[sortBy];
      bValue = (b as any)[sortBy];
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Get session duration string
 */
export function getSessionDuration(session: SessionResponse): string {
  const duration = session.actualDuration || session.duration;

  if (duration < 60) {
    return `${duration} min`;
  }

  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Validate status transition
 */
export function canTransitionStatus(
  currentStatus: SessionStatus,
  newStatus: SessionStatus
): boolean {
  // Completed sessions shouldn't go back to planned
  if (currentStatus === 'completed' && newStatus === 'planned') {
    return false;
  }

  // All other transitions are allowed
  return true;
}
