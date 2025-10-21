/**
 * User entity type definition
 * Based on Prisma User model, excluding sensitive fields from public-facing type
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User entity with password field
 * @internal - Only for backend use, never expose to frontend
 */
export interface UserWithPassword extends User {
  password: string;
}

/**
 * Data required to create a new user
 */
export type CreateUserData = Omit<UserWithPassword, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Data that can be updated on a user
 */
export type UpdateUserData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
