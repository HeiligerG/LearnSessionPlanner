import type { PaginatedResponse, ISODateString } from './common.dto';

/**
 * Create progress DTO
 */
export interface CreateProgressDto {
  sessionId: string;
  notes?: string;
  rating?: number;
  completionPercentage: number;
  recordedAt?: string;
}

/**
 * Update progress DTO
 */
export interface UpdateProgressDto {
  sessionId?: string;
  notes?: string;
  rating?: number;
  completionPercentage?: number;
  recordedAt?: string;
}

/**
 * Progress response with ISO date strings for JSON serialization
 */
export interface ProgressResponse {
  id: string;
  sessionId: string;
  notes: string | null;
  rating: number | null;
  completionPercentage: number;
  recordedAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Paginated progress list response
 */
export type ProgressListResponse = PaginatedResponse<ProgressResponse>;

/**
 * Progress filters for query parameters
 */
export interface ProgressFilters {
  sessionId?: string;
  userId?: string;
  recordedFrom?: string;
  recordedTo?: string;
  minRating?: number;
}
