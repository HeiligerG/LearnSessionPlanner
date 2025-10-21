import type { Session } from '../entities/session.entity';
import type { SessionCategory } from '../enums/session-category.enum';
import type { PaginatedResponse } from './common.dto';

/**
 * Create session DTO
 */
export interface CreateSessionDto {
  title: string;
  description?: string;
  category: SessionCategory;
  duration: number;
  scheduledFor?: Date | string;
}

/**
 * Update session DTO
 */
export interface UpdateSessionDto {
  title?: string;
  description?: string;
  category?: SessionCategory;
  duration?: number;
  scheduledFor?: Date | string | null;
  completedAt?: Date | string | null;
}

/**
 * Session response (alias for Session entity)
 */
export type SessionResponse = Session;

/**
 * Paginated sessions list response
 */
export type SessionsListResponse = PaginatedResponse<Session>;

/**
 * Session filters for query parameters
 */
export interface SessionFilters {
  category?: SessionCategory;
  completed?: boolean;
  scheduledFrom?: Date | string;
  scheduledTo?: Date | string;
  userId?: string;
}
