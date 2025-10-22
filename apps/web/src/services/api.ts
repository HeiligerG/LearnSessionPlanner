/**
 * Base API client configuration
 *
 * This module provides a centralized API client for making HTTP requests
 * to the backend API. It uses the native Fetch API with proper error handling.
 */

import type {
  ApiResponse,
  LoginDto,
  RegisterDto,
  AuthResponse,
  CreateSessionDto,
  UpdateSessionDto,
  SessionResponse,
  SessionsListResponse,
  SessionFilters,
} from '@repo/shared-types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      )
    }

    // Handle 204 No Content - normalize to ApiResponse envelope
    if (response.status === 204) {
      return { success: true } as T
    }

    // Try to parse JSON response
    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unknown error occurred',
      0
    )
  }
}

/**
 * HTTP methods
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}

/**
 * Typed API helper methods using shared DTOs
 */
export const api = {
  // Authentication endpoints
  auth: {
    /**
     * User login
     */
    login(dto: LoginDto): Promise<ApiResponse<AuthResponse>> {
      return apiClient.post<ApiResponse<AuthResponse>>('/auth/login', dto)
    },

    /**
     * User registration
     */
    register(dto: RegisterDto): Promise<ApiResponse<AuthResponse>> {
      return apiClient.post<ApiResponse<AuthResponse>>('/auth/register', dto)
    },

    /**
     * User logout
     */
    logout(): Promise<ApiResponse<void>> {
      return apiClient.post<ApiResponse<void>>('/auth/logout')
    },
  },

  // Session endpoints
  sessions: {
    /**
     * Get all sessions with optional filters
     */
    getAll(filters?: SessionFilters): Promise<ApiResponse<SessionsListResponse>> {
      const params = new URLSearchParams()
      if (filters?.category) params.append('category', filters.category)
      if (filters?.completed !== undefined) params.append('completed', String(filters.completed))
      if (filters?.scheduledFrom) params.append('scheduledFrom', filters.scheduledFrom)
      if (filters?.scheduledTo) params.append('scheduledTo', filters.scheduledTo)
      if (filters?.userId) params.append('userId', filters.userId)

      const query = params.toString() ? `?${params.toString()}` : ''
      return apiClient.get<ApiResponse<SessionsListResponse>>(`/sessions${query}`)
    },

    /**
     * Get a single session by ID
     */
    getById(id: string): Promise<ApiResponse<SessionResponse>> {
      return apiClient.get<ApiResponse<SessionResponse>>(`/sessions/${id}`)
    },

    /**
     * Create a new session
     */
    create(dto: CreateSessionDto): Promise<ApiResponse<SessionResponse>> {
      return apiClient.post<ApiResponse<SessionResponse>>('/sessions', dto)
    },

    /**
     * Update an existing session
     */
    update(id: string, dto: UpdateSessionDto): Promise<ApiResponse<SessionResponse>> {
      return apiClient.patch<ApiResponse<SessionResponse>>(`/sessions/${id}`, dto)
    },

    /**
     * Delete a session
     */
    delete(id: string): Promise<ApiResponse<void>> {
      return apiClient.delete<ApiResponse<void>>(`/sessions/${id}`)
    },
  },
}

/**
 * Log API configuration in development
 */
if (import.meta.env.DEV) {
  console.log('[API Client] Base URL:', API_URL)
}
