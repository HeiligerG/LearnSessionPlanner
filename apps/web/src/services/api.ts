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
  RefreshResponse,
  CsrfTokenResponse,
  CreateSessionDto,
  UpdateSessionDto,
  SessionResponse,
  SessionsListResponse,
  SessionFilters,
  SessionStatsDto,
  CalendarSessionDto,
  DetailedStatsDto,
  CategoryStatsDto,
  TrendDataPoint,
  BulkCreateSessionDto,
  BulkCreateResult,
  BulkUpdateSessionDto,
  BulkOperationResult,
  ExportFormat,
  SessionSuggestionDto,
  GamificationSummaryDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateResponse,
  TemplatesListResponse,
  TemplateFilters,
  FileImportResultDto,
} from '@repo/shared-types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

// In-memory access token storage
let accessToken: string | null = null

/**
 * Set the access token for authenticated requests
 */
export function setAccessToken(token: string | null) {
  accessToken = token
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  return accessToken
}

// CSRF token storage
let csrfToken: string | null = null
let csrfTokenPromise: Promise<void> | null = null

/**
 * Ensure CSRF token is fetched
 */
async function ensureCsrfToken() {
  if (csrfToken) return

  // If already fetching, wait for that request
  if (csrfTokenPromise) {
    await csrfTokenPromise
    return
  }

  // Fetch CSRF token
  csrfTokenPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/csrf-token`, {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success && data.data?.csrfToken) {
        csrfToken = data.data.csrfToken
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error)
    } finally {
      csrfTokenPromise = null
    }
  })()

  await csrfTokenPromise
}

// Refresh lock to prevent parallel refresh storms
let refreshInFlight = false

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

  // Ensure CSRF token for non-GET requests
  const method = options.method?.toUpperCase() || 'GET'
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    await ensureCsrfToken()
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // Add Authorization header if access token exists
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  // Add CSRF token for non-GET requests
  if (csrfToken && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    headers['X-CSRF-Token'] = csrfToken
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include cookies for refresh token
  }

  try {
    const response = await fetch(url, config)

    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401 && !refreshInFlight && !endpoint.includes('/auth/refresh')) {
      refreshInFlight = true

      try {
        // Try to refresh the token
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          if (refreshData.success && refreshData.data?.accessToken) {
            // Update access token
            setAccessToken(refreshData.data.accessToken)

            // Retry the original request with new token
            const retryHeaders = { ...headers, Authorization: `Bearer ${refreshData.data.accessToken}` }
            const retryResponse = await fetch(url, { ...config, headers: retryHeaders })

            if (retryResponse.ok) {
              if (retryResponse.status === 204) {
                return { success: true } as T
              }
              return await retryResponse.json()
            }
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
      } finally {
        refreshInFlight = false
      }
    }

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
 * File upload with progress support
 */
export async function uploadFile<T>(
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  // Ensure CSRF token for file upload
  await ensureCsrfToken()

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Set up progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          onProgress(Math.round(progress))
        }
      })
    }

    // Handle response
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          reject(new ApiError('Failed to parse response', xhr.status))
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText)
          reject(new ApiError(
            errorData.message || `HTTP ${xhr.status}: ${xhr.statusText}`,
            xhr.status,
            errorData
          ))
        } catch {
          reject(new ApiError(
            `HTTP ${xhr.status}: ${xhr.statusText}`,
            xhr.status
          ))
        }
      }
    })

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new ApiError('Network error', 0))
    })

    xhr.addEventListener('abort', () => {
      reject(new ApiError('Request aborted', 0))
    })

    // Prepare form data
    const formData = new FormData()
    formData.append('file', file)

    // Open and send request
    xhr.open('POST', url)
    
    // Set headers
    if (accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    }
    if (csrfToken) {
      xhr.setRequestHeader('X-CSRF-Token', csrfToken)
    }
    
    xhr.withCredentials = true // Include cookies
    xhr.send(formData)
  })
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
    async login(dto: LoginDto): Promise<ApiResponse<AuthResponse>> {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', dto)
      if (response.data?.accessToken) {
        setAccessToken(response.data.accessToken)
      }
      return response
    },

    /**
     * User registration
     */
    async register(dto: RegisterDto): Promise<ApiResponse<AuthResponse>> {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', dto)
      if (response.data?.accessToken) {
        setAccessToken(response.data.accessToken)
      }
      return response
    },

    /**
     * Refresh access token
     */
    async refresh(): Promise<ApiResponse<RefreshResponse>> {
      const response = await apiClient.post<ApiResponse<RefreshResponse>>('/auth/refresh')
      if (response.data?.accessToken) {
        setAccessToken(response.data.accessToken)
      }
      return response
    },

    /**
     * Get current user profile
     */
    getProfile(): Promise<ApiResponse<{ user: AuthResponse['user'] }>> {
      return apiClient.get<ApiResponse<{ user: AuthResponse['user'] }>>('/auth/me')
    },

    /**
     * Get CSRF token
     */
    getCsrfToken(): Promise<ApiResponse<CsrfTokenResponse>> {
      return apiClient.get<ApiResponse<CsrfTokenResponse>>('/auth/csrf-token')
    },

    /**
     * User logout
     */
    async logout(): Promise<ApiResponse<void>> {
      const response = await apiClient.post<ApiResponse<void>>('/auth/logout')
      setAccessToken(null)
      return response
    },

    /**
     * Logout from all devices
     */
    async logoutAll(): Promise<ApiResponse<void>> {
      const response = await apiClient.post<ApiResponse<void>>('/auth/logout-all')
      setAccessToken(null)
      return response
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
      if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
        statuses.forEach(s => params.append('status', s))
      }
      if (filters?.priority) {
        const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority]
        priorities.forEach(p => params.append('priority', p))
      }
      if (filters?.tags) {
        filters.tags.forEach(tag => params.append('tags', tag))
      }
      if (filters?.search) params.append('search', filters.search)
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
     * Bulk create sessions
     */
    bulkCreate(dto: BulkCreateSessionDto): Promise<ApiResponse<BulkCreateResult>> {
      return apiClient.post<ApiResponse<BulkCreateResult>>('/sessions/bulk', dto)
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

    /**
     * Get session statistics
     */
    getStats(startDate?: string, endDate?: string): Promise<ApiResponse<SessionStatsDto>> {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const query = params.toString() ? `?${params.toString()}` : ''
      return apiClient.get<ApiResponse<SessionStatsDto>>(`/sessions/stats${query}`)
    },

    /**
     * Get sessions for calendar view
     */
    getCalendar(dto: CalendarSessionDto): Promise<ApiResponse<SessionResponse[]>> {
      const params = new URLSearchParams()
      params.append('startDate', dto.startDate)
      params.append('endDate', dto.endDate)
      if (dto.view) params.append('view', dto.view)
      if (dto.categories) {
        dto.categories.forEach(cat => params.append('categories', cat))
      }
      if (dto.statuses) {
        dto.statuses.forEach(status => params.append('statuses', status))
      }

      const query = params.toString()
      return apiClient.get<ApiResponse<SessionResponse[]>>(`/sessions/calendar?${query}`)
    },

    /**
     * Get detailed statistics
     */
    getDetailedStats(startDate?: string, endDate?: string): Promise<ApiResponse<DetailedStatsDto>> {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const query = params.toString() ? `?${params.toString()}` : ''
      return apiClient.get<ApiResponse<DetailedStatsDto>>(`/sessions/stats/detailed${query}`)
    },

    /**
     * Get category statistics
     */
    getCategoryStats(startDate?: string, endDate?: string): Promise<ApiResponse<CategoryStatsDto[]>> {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const query = params.toString() ? `?${params.toString()}` : ''
      return apiClient.get<ApiResponse<CategoryStatsDto[]>>(`/sessions/stats/category${query}`)
    },

    /**
     * Get trend data
     */
    getTrendData(startDate: string, endDate: string): Promise<ApiResponse<TrendDataPoint[]>> {
      const params = new URLSearchParams()
      params.append('startDate', startDate)
      params.append('endDate', endDate)

      const query = params.toString()
      return apiClient.get<ApiResponse<TrendDataPoint[]>>(`/sessions/stats/trends?${query}`)
    },

    /**
     * Search sessions by query string
     */
    search(query: string): Promise<ApiResponse<SessionResponse[]>> {
      const params = new URLSearchParams()
      params.append('q', query)

      return apiClient.get<ApiResponse<SessionResponse[]>>(`/sessions/search?${params.toString()}`)
    },

    /**
     * Import sessions from file (CSV, JSON, XML)
     */
    importFile(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<FileImportResultDto>> {
      return uploadFile<ApiResponse<FileImportResultDto>>('/sessions/import', file, onProgress)
    },

    /**
     * Download sample file
     */
    async downloadSample(format: 'csv' | 'json' | 'xml'): Promise<Blob> {
      const url = `${API_URL}/sessions/sample/${format}`

      // Ensure CSRF token
      await ensureCsrfToken()

      const headers: Record<string, string> = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      return await response.blob()
    },

    /**
     * Bulk update sessions
     */
    bulkUpdate(dto: BulkUpdateSessionDto): Promise<ApiResponse<BulkOperationResult>> {
      return apiClient.post<ApiResponse<BulkOperationResult>>('/sessions/bulk-update', dto)
    },

    /**
     * Bulk delete sessions
     */
    bulkDelete(sessionIds: string[]): Promise<ApiResponse<BulkOperationResult>> {
      return apiClient.post<ApiResponse<BulkOperationResult>>('/sessions/bulk-delete', { sessionIds })
    },

    /**
     * Export sessions to CSV or JSON
     */
    async exportSessions(format: ExportFormat, filters?: SessionFilters): Promise<Blob> {
      const params = new URLSearchParams()
      params.append('format', format)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
        statuses.forEach(s => params.append('status', s))
      }
      if (filters?.priority) {
        const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority]
        priorities.forEach(p => params.append('priority', p))
      }
      if (filters?.search) params.append('search', filters.search)
      if (filters?.scheduledFrom) params.append('scheduledFrom', filters.scheduledFrom)
      if (filters?.scheduledTo) params.append('scheduledTo', filters.scheduledTo)

      const url = `${API_URL}/sessions/export?${params.toString()}`

      // Ensure CSRF token
      await ensureCsrfToken()

      const headers: Record<string, string> = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      return await response.blob()
    },

    /**
     * Get session suggestions based on user patterns
     */
    getSuggestions(): Promise<ApiResponse<SessionSuggestionDto[]>> {
      return apiClient.get<ApiResponse<SessionSuggestionDto[]>>('/sessions/suggestions')
    },

    /**
     * Get gamification summary (achievements, streaks, level)
     */
    getGamification(): Promise<ApiResponse<GamificationSummaryDto>> {
      return apiClient.get<ApiResponse<GamificationSummaryDto>>('/sessions/gamification')
    },

    /**
     * Export statistics as CSV or JSON
     */
    async exportStats(format: 'csv' | 'json', startDate?: string, endDate?: string): Promise<Blob> {
      const params = new URLSearchParams()
      params.append('format', format)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const query = params.toString() ? `?${params.toString()}` : ''
      const response = await fetch(`${API_URL}/sessions/export/stats${query}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to export statistics')
      }

      return response.blob()
    },
  },

  // Template endpoints
  templates: {
    /**
     * Get all templates with optional filters
     */
    getAll(filters?: TemplateFilters): Promise<ApiResponse<TemplatesListResponse>> {
      const params = new URLSearchParams()
      if (filters?.category) params.append('category', filters.category)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.tags) {
        filters.tags.forEach(tag => params.append('tags', tag))
      }

      const query = params.toString() ? `?${params.toString()}` : ''
      return apiClient.get<ApiResponse<TemplatesListResponse>>(`/templates${query}`)
    },

    /**
     * Get a single template by ID
     */
    getById(id: string): Promise<ApiResponse<TemplateResponse>> {
      return apiClient.get<ApiResponse<TemplateResponse>>(`/templates/${id}`)
    },

    /**
     * Create a new template
     */
    create(dto: CreateTemplateDto): Promise<ApiResponse<TemplateResponse>> {
      return apiClient.post<ApiResponse<TemplateResponse>>('/templates', dto)
    },

    /**
     * Update an existing template
     */
    update(id: string, dto: UpdateTemplateDto): Promise<ApiResponse<TemplateResponse>> {
      return apiClient.patch<ApiResponse<TemplateResponse>>(`/templates/${id}`, dto)
    },

    /**
     * Delete a template
     */
    delete(id: string): Promise<ApiResponse<void>> {
      return apiClient.delete<ApiResponse<void>>(`/templates/${id}`)
    },

    /**
     * Search templates by name or title
     */
    search(query: string): Promise<ApiResponse<TemplateResponse[]>> {
      const params = new URLSearchParams()
      params.append('q', query)

      return apiClient.get<ApiResponse<TemplateResponse[]>>(`/templates/search?${params.toString()}`)
    },
  },
}

/**
 * Log API configuration in development
 */
if (import.meta.env.DEV) {
  console.log('[API Client] Base URL:', API_URL)
}
