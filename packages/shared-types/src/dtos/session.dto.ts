import type { SessionCategory } from '../enums/session-category.enum';
import type { SessionStatus } from '../enums/session-status.enum';
import type { SessionPriority } from '../enums/session-priority.enum';
import type { PaginatedResponse, ISODateString, PaginationQuery } from './common.dto';

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

/**
 * Category statistics DTO
 */
export interface CategoryStatsDto {
  category: SessionCategory;
  totalSessions: number;
  completedSessions: number;
  totalDuration: number;
  completedDuration: number;
  completionRate: number;
}

/**
 * Trend data point DTO
 */
export interface TrendDataPoint {
  date: string; // YYYY-MM-DD format
  planned: number;
  completed: number;
  inProgress: number;
  missed: number;
  cancelled: number;
}

/**
 * Time distribution DTO
 */
export interface TimeDistributionDto {
  totalPlannedHours: number;
  totalCompletedHours: number;
  averageSessionDuration: number;
  longestSession: number;
  shortestSession: number;
  byDayOfWeek: Array<{ day: string; hours: number }>;
}

/**
 * Productivity metrics DTO
 */
export interface ProductivityMetricsDto {
  completionRate: number;
  onTimeCompletionRate: number;
  averageDelayDays: number;
  mostProductiveCategory: SessionCategory;
  mostProductiveTimeOfDay: string;
  streakDays: number;
}

/**
 * Detailed statistics DTO
 */
export interface DetailedStatsDto {
  overview: SessionStatsDto;
  byCategory: CategoryStatsDto[];
  trends: TrendDataPoint[];
  timeDistribution: TimeDistributionDto;
  productivity: ProductivityMetricsDto;
}

/**
 * Recurrence pattern for bulk session creation
 */
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endType: 'date' | 'count' | 'never';
  endDate?: string;
  endCount?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

/**
 * Bulk create session DTO
 */
export interface BulkCreateSessionDto {
  sessions: CreateSessionDto[];
  recurrence?: RecurrencePattern;
  applyRecurrenceToAll?: boolean;
}

/**
 * Bulk create result DTO
 */
export interface BulkCreateResult {
  successful: SessionResponse[];
  failed: Array<{ session: CreateSessionDto; error: string }>;
  totalCreated: number;
  totalFailed: number;
}

/**
 * Create template DTO
 */
export interface CreateTemplateDto {
  name: string;
  title: string;
  description?: string;
  category: SessionCategory;
  priority?: SessionPriority;
  duration: number;
  color?: string;
  tags?: string[];
  notes?: string;
}

/**
 * Update template DTO
 */
export interface UpdateTemplateDto {
  name?: string;
  title?: string;
  description?: string;
  category?: SessionCategory;
  priority?: SessionPriority;
  duration?: number;
  color?: string;
  tags?: string[];
  notes?: string;
}

/**
 * Template response DTO
 */
export interface TemplateResponse {
  id: string;
  name: string;
  title: string;
  description: string | null;
  category: SessionCategory;
  priority: SessionPriority;
  duration: number;
  color: string | null;
  tags: string[];
  notes: string | null;
  userId: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Template filters for querying
 */
export interface TemplateFilters {
  category?: SessionCategory;
  search?: string;
  tags?: string[];
}

/**
 * Template query combining filters and pagination
 */
export interface TemplateQuery extends TemplateFilters, PaginationQuery {}

/**
 * Templates list response (paginated)
 */
export type TemplatesListResponse = PaginatedResponse<TemplateResponse>;

/**
 * File import result DTO
 */
export interface FileImportResultDto {
  summary: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    duplicateRows: number;
    warningRows: number;
  };
  rows: ParsedSessionRowDto[];
  errors: string[];
}

/**
 * Parsed session row DTO
 */
export interface ParsedSessionRowDto {
  rowNumber: number;
  session: CreateSessionDto;
  status: 'success' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
}

/**
 * Sample file format type
 */
export type SampleFileFormat = 'csv' | 'json' | 'xml';

/**
 * Bulk update session DTO
 */
export interface BulkUpdateSessionDto {
  sessionIds: string[];
  updates: Partial<UpdateSessionDto>;
}

/**
 * Bulk delete DTO
 */
export interface BulkDeleteDto {
  sessionIds: string[];
}

/**
 * Bulk operation result DTO
 */
export interface BulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
  totalProcessed: number;
}

/**
 * Export format type
 */
export type ExportFormat = 'csv' | 'json';

/**
 * Session suggestion DTO
 */
export interface SessionSuggestionDto {
  suggestedTitle: string;
  suggestedCategory: SessionCategory;
  suggestedDuration: number;
  suggestedTags: string[];
  reason: string;
  confidence: number; // 0-1
}

/**
 * Achievement DTO
 */
export interface AchievementDto {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: ISODateString | null;
  progress: number; // 0-100
  category: string;
}

/**
 * Gamification summary DTO
 */
export interface GamificationSummaryDto {
  currentStreak: number;
  longestStreak: number;
  totalSessionsCompleted: number;
  achievements: AchievementDto[];
  level: number;
  experiencePoints: number;
  nextLevelThreshold: number;
}
