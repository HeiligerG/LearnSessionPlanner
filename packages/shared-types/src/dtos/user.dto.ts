import type { PaginatedResponse, ISODateString } from './common.dto';

/**
 * Update user DTO
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
}

/**
 * User response with ISO date strings for JSON serialization
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * Paginated users list response
 */
export type UsersListResponse = PaginatedResponse<UserResponse>;
