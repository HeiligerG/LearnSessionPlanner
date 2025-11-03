export enum SessionStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
}

export const SESSION_STATUSES = [
  SessionStatus.PLANNED,
  SessionStatus.IN_PROGRESS,
  SessionStatus.COMPLETED,
  SessionStatus.MISSED,
  SessionStatus.CANCELLED,
] as const;

export const SESSION_STATUS_COLORS = {
  planned: 'indigo',
  in_progress: 'blue',
  completed: 'green',
  missed: 'red',
  cancelled: 'gray',
} as const;
