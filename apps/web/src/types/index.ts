/**
 * Type definitions for the web application
 *
 * This file serves as the central export point for all type definitions.
 * Add type files here as the application grows.
 */

// Re-export shared types for convenience (type-only to avoid bundling values)
// NOTE: Only export DTO response types, NOT entity types with Date fields
export type {
  // Enums
  SessionCategory,
  // DTOs - Common
  ISODateString,
  PaginationQuery,
  PaginationMeta,
  PaginatedResponse,
  ApiError,
  ApiResponse,
  // DTOs - Auth
  RegisterDto,
  LoginDto,
  AuthResponse,
  RefreshTokenDto,
  ChangePasswordDto,
  // DTOs - User
  UpdateUserDto,
  UserResponse,
  UsersListResponse,
  // DTOs - Session
  CreateSessionDto,
  UpdateSessionDto,
  SessionResponse,
  SessionsListResponse,
  SessionFilters,
  // DTOs - Progress
  CreateProgressDto,
  UpdateProgressDto,
  ProgressResponse,
  ProgressListResponse,
  ProgressFilters,
} from '@repo/shared-types';

// Re-export enum values (need to be value exports)
export { SESSION_CATEGORIES } from '@repo/shared-types';

// Add web-specific types below
// export * from './ui.types'
// export * from './state.types'
