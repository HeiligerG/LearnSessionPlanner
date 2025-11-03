import type { SessionCategory } from '../enums/session-category.enum';
import type { SessionStatus } from '../enums/session-status.enum';
import type { SessionPriority } from '../enums/session-priority.enum';
import type { User } from './user.entity';

/**
 * Session entity type definition for learning sessions
 */
export interface Session {
  id: string;
  title: string;
  description: string | null;
  category: SessionCategory;
  status: SessionStatus;
  priority: SessionPriority;
  duration: number;
  actualDuration: number | null;
  color: string | null;
  tags: string[];
  notes: string | null;
  scheduledFor: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Session entity with user relation populated
 */
export interface SessionWithUser extends Session {
  user: User;
}

/**
 * Session with computed status flags
 */
export type SessionWithStatus = Session & {
  isOverdue: boolean;
  isToday: boolean;
  isUpcoming: boolean;
};
