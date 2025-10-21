import type { User } from '../entities/user.entity';
import type { PaginatedResponse } from './common.dto';

/**
 * Update user DTO
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
}

/**
 * User response (alias for User entity)
 */
export type UserResponse = User;

/**
 * Paginated users list response
 */
export type UsersListResponse = PaginatedResponse<User>;
