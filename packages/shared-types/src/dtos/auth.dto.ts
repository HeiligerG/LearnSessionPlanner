import type { UserResponse } from './user.dto';

/**
 * User registration DTO
 */
export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

/**
 * User login DTO
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Authentication response with user and tokens
 */
export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
}

/**
 * Refresh response
 */
export interface RefreshResponse {
  accessToken: string;
}

/**
 * CSRF token response
 */
export interface CsrfTokenResponse {
  csrfToken: string;
}

/**
 * Change password DTO
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
