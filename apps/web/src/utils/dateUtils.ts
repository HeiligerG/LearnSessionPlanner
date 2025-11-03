/**
 * Format date to readable string
 */
export function formatDate(date: Date | string, format: string = 'MMM DD, YYYY'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (format === 'time') {
    return formatTime(d);
  }

  if (format === 'datetime') {
    return `${formatDate(d)} ${formatTime(d)}`;
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time to readable string
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Convert minutes to readable duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  return `${hours}h ${mins}min`;
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear();
}

/**
 * Check if date is in current week
 */
export function isThisWeek(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return d >= weekStart && d < weekEnd;
}

/**
 * Check if date is in the past
 */
export function isOverdue(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Get array of dates for the week containing the given date
 */
export function getWeekDays(date: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // Start from Sunday

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  return days;
}

/**
 * Get array of dates for the month containing the given date
 */
export function getMonthDays(date: Date): Date[] {
  const days: Date[] = [];
  const year = date.getFullYear();
  const month = date.getMonth();

  // First day of month
  const firstDay = new Date(year, month, 1);
  // Last day of month
  const lastDay = new Date(year, month + 1, 0);

  // Add padding days from previous month
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    const day = new Date(firstDay);
    day.setDate(firstDay.getDate() - i - 1);
    days.push(day);
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Add padding days from next month
  const endPadding = 6 - lastDay.getDay();
  for (let i = 1; i <= endPadding; i++) {
    const day = new Date(lastDay);
    day.setDate(lastDay.getDate() + i);
    days.push(day);
  }

  return days;
}

/**
 * Get relative time string
 */
export function getRelativeTimeString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins === 0) {
    return 'now';
  }

  if (diffMins < 0) {
    // Past
    if (Math.abs(diffMins) < 60) {
      return `${Math.abs(diffMins)} minutes ago`;
    }
    if (Math.abs(diffHours) < 24) {
      return `${Math.abs(diffHours)} ${Math.abs(diffHours) === 1 ? 'hour' : 'hours'} ago`;
    }
    if (Math.abs(diffDays) === 1) {
      return 'yesterday';
    }
    if (Math.abs(diffDays) < 7) {
      return `${Math.abs(diffDays)} days ago`;
    }
    return formatDate(d);
  } else {
    // Future
    if (diffMins < 60) {
      return `in ${diffMins} minutes`;
    }
    if (diffHours < 24) {
      return `in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
    }
    if (diffDays === 1) {
      return 'tomorrow';
    }
    if (diffDays < 7) {
      return `in ${diffDays} days`;
    }
    return formatDate(d);
  }
}

/**
 * Parse ISO date string to Date
 */
export function parseISODate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Convert Date to ISO string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}
