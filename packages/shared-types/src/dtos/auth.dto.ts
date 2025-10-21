import type { User } from '../entities/user.entity';

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
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Refresh token DTO
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * Change password DTO
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
