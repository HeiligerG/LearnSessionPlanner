import type { SessionCategory } from '../enums/session-category.enum';
import type { PaginatedResponse, ISODateString } from './common.dto';

/**
 * Create session DTO
 */
export interface CreateSessionDto {
  title: string;
  description?: string;
  category: SessionCategory;
  duration: number;
  scheduledFor?: string;
}

/**
 * Update session DTO
 */
export interface UpdateSessionDto {
  title?: string;
  description?: string;
  category?: SessionCategory;
  duration?: number;
  scheduledFor?: string | null;
  completedAt?: string | null;
}

/**
 * Session response with ISO date strings for JSON serialization
 */
export interface SessionResponse {
  id: string;
  title: string;
  description: string | null;
  category: SessionCategory;
  duration: number;
  scheduledFor: ISODateString | null;
  completedAt: ISODateString | null;
  userId: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Paginated sessions list response
 */
export type SessionsListResponse = PaginatedResponse<SessionResponse>;

/**
 * Session filters for query parameters
 */
export interface SessionFilters {
  category?: SessionCategory;
  completed?: boolean;
  scheduledFrom?: string;
  scheduledTo?: string;
  userId?: string;
}
