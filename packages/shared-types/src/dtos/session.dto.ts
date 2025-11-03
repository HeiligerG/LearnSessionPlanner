import type { SessionCategory } from '../enums/session-category.enum';
import type { SessionStatus } from '../enums/session-status.enum';
import type { SessionPriority } from '../enums/session-priority.enum';
import type { PaginatedResponse, ISODateString } from './common.dto';

/**
 * Create session DTO
 */
export interface CreateSessionDto {
  title: string;
  description?: string;
  category: SessionCategory;
  status?: SessionStatus;
  priority?: SessionPriority;
  duration: number;
  color?: string;
  tags?: string[];
  notes?: string;
  scheduledFor?: string;
}

/**
 * Update session DTO
 */
export interface UpdateSessionDto {
  title?: string;
  description?: string;
  category?: SessionCategory;
  status?: SessionStatus;
  priority?: SessionPriority;
  duration?: number;
  actualDuration?: number | null;
  color?: string | null;
  tags?: string[];
  notes?: string | null;
  scheduledFor?: string | null;
  startedAt?: string | null;
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
  status: SessionStatus;
  priority: SessionPriority;
  duration: number;
  actualDuration: number | null;
  color: string | null;
  tags: string[];
  notes: string | null;
  scheduledFor: ISODateString | null;
  startedAt: ISODateString | null;
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
  status?: SessionStatus | SessionStatus[];
  priority?: SessionPriority | SessionPriority[];
  tags?: string[];
  search?: string;
  completed?: boolean;
  scheduledFrom?: string;
  scheduledTo?: string;
  userId?: string;
}

/**
 * Calendar session query DTO
 */
export interface CalendarSessionDto {
  startDate: string;
  endDate: string;
  view?: 'month' | 'week' | 'day';
  categories?: SessionCategory[];
  statuses?: SessionStatus[];
}

/**
 * Session statistics DTO
 */
export interface SessionStatsDto {
  total: number;
  completed: number;
  inProgress: number;
  missed: number;
  planned: number;
  totalDuration: number;
  completedDuration: number;
  completionRate: number;
}
