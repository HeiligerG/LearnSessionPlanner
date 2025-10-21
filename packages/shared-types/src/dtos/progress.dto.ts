import type { Progress } from '../entities/progress.entity';
import type { PaginatedResponse } from './common.dto';

/**
 * Create progress DTO
 */
export interface CreateProgressDto {
  sessionId: string;
  notes?: string;
  rating?: number;
  completionPercentage: number;
  recordedAt?: Date | string;
}

/**
 * Update progress DTO
 */
export interface UpdateProgressDto {
  sessionId?: string;
  notes?: string;
  rating?: number;
  completionPercentage?: number;
  recordedAt?: Date | string;
}

/**
 * Progress response (alias for Progress entity)
 */
export type ProgressResponse = Progress;

/**
 * Paginated progress list response
 */
export type ProgressListResponse = PaginatedResponse<Progress>;

/**
 * Progress filters for query parameters
 */
export interface ProgressFilters {
  sessionId?: string;
  userId?: string;
  recordedFrom?: Date | string;
  recordedTo?: Date | string;
  minRating?: number;
}
