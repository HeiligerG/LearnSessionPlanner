import type { SessionCategory } from '../enums/session-category.enum';
import type { User } from './user.entity';

/**
 * Session entity type definition for learning sessions
 */
export interface Session {
  id: string;
  title: string;
  description: string | null;
  category: SessionCategory;
  duration: number;
  scheduledFor: Date | null;
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
