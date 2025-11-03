export enum SessionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export const SESSION_PRIORITIES = [
  SessionPriority.LOW,
  SessionPriority.MEDIUM,
  SessionPriority.HIGH,
  SessionPriority.URGENT,
] as const;

export const SESSION_PRIORITY_COLORS = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
} as const;
