import React, { useState, useMemo } from 'react'
import { Plus, Upload, Search as SearchIcon } from 'lucide-react'
import type { SessionResponse, SessionStatus, SessionPriority, SessionCategory, CreateSessionDto, UpdateSessionDto, BulkCreateSessionDto, BulkCreateResult, TemplateResponse } from '@repo/shared-types'
import { useSessions } from '@/hooks/useSessions'
import { useRecentSessions } from '@/hooks/useRecentSessions'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { SessionCard } from '@/components/sessions/SessionCard'
import { SessionForm } from '@/components/sessions/SessionForm'
import { BulkSessionForm } from '@/components/sessions/BulkSessionForm'
import { SessionSearchModal } from '@/components/sessions/SessionSearchModal'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { KeyboardShortcutsHelp } from '@/components/common/KeyboardShortcutsHelp'
import { useToast, useToastConfirm } from '@/contexts/ToastContext'
import { filterSessions, sortSessions, groupSessionsByDate } from '@/utils/sessionUtils'

type SortOption = 'date' | 'priority' | 'status' | 'category'
type GroupOption = 'none' | 'date' | 'status' | 'category'

const SessionsPage: React.FC = () => {
  const toast = useToast()
  const confirm = useToastConfirm()
  const { sessions: rawSessions, loading, error, createSession, bulkCreateSessions, updateSession, deleteSession, refetch, updateFilters, filters } = useSessions()
  const { addRecentSession } = useRecentSessions()

  // Normalize sessions at the boundary - filter out any invalid entries
  const sessions = useMemo(() => {
    if (!Array.isArray(rawSessions)) return []
    return rawSessions.filter((s): s is SessionResponse =>
      s != null &&
      typeof s === 'object' &&
      !!s.id &&
      !!s.category &&
      !!s.status
    )
  }, [rawSessions])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkCreateResult | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionResponse | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [groupBy, setGroupBy] = useState<GroupOption>('date')

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    {
      key: 'n',
      description: 'Create new session',
      action: () => setIsFormOpen(true),
    },
    {
      key: 'b',
      description: 'Bulk create sessions',
      action: () => setIsBulkFormOpen(true),
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Quick search',
      action: () => setIsSearchModalOpen(true),
    },
    {
      key: 'r',
      description: 'Refresh sessions',
      action: () => refetch(),
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => setIsHelpOpen(prev => !prev),
    },
    {
      key: 'Escape',
      description: 'Close modals',
      action: () => {
        setIsFormOpen(false)
        setIsBulkFormOpen(false)
        setIsSearchModalOpen(false)
        setIsHelpOpen(false)
      },
    },
  ], [refetch])

  useKeyboardShortcuts({ shortcuts })

  // Apply filters, search, and sort
  const processedSessions = useMemo(() => {
    // Filter out any null/undefined sessions first
    let result = sessions.filter(s => s != null)

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(s =>
        s.title?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term) ||
        s.tags?.some(tag => tag.toLowerCase().includes(term))
      )
    }

    // Sort
    result = sortSessions(result, sortBy === 'date' ? 'scheduledFor' : sortBy)

    return result
  }, [sessions, searchTerm, sortBy])

  // Group sessions
  const groupedSessions = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Sessions': processedSessions }
    }
    if (groupBy === 'date') {
      return groupSessionsByDate(processedSessions)
    }
    // Group by status or category
    const groups: Record<string, SessionResponse[]> = {}
    processedSessions.forEach(session => {
      // Extra safety check - skip if session is undefined or missing required fields
      if (!session || !session.status || !session.category) return

      const key = groupBy === 'status' ? session.status : session.category
      if (!groups[key]) groups[key] = []
      groups[key].push(session)
    })
    return groups
  }, [processedSessions, groupBy])

  const handleCreateSession = async (data: CreateSessionDto) => {
    await createSession(data)
    setIsFormOpen(false)
  }

  const handleUpdateSession = async (id: string, data: UpdateSessionDto) => {
    await updateSession(id, data)
    setIsFormOpen(false)
    setSelectedSession(undefined)
  }

  const handleDeleteSession = async (id: string) => {
    const confirmed = await confirm('Are you sure you want to delete this session?')
    if (confirmed) {
      try {
        await deleteSession(id)
        toast.success('Session deleted successfully')
      } catch (error) {
        console.error('Error deleting session:', error)
        toast.error('Failed to delete session')
      }
    }
  }

  const handleEditClick = (session: SessionResponse) => {
    // Comment 8: Add to recent sessions when editing
    addRecentSession(session)
    setSelectedSession(session)
    setIsFormOpen(true)
  }

  // Comment 6: Duplicate session handler
  const handleDuplicateSession = async (session: SessionResponse) => {
    try {
      const duplicateDto = {
        title: session.title,
        description: session.description,
        category: session.category,
        priority: session.priority,
        duration: session.duration,
        tags: session.tags,
        notes: session.notes,
        status: 'planned' as const,
      }
      await createSession(duplicateDto)
      toast.success('Session duplicated successfully')
    } catch (error) {
      console.error('Failed to duplicate session:', error)
      toast.error('Failed to duplicate session')
    }
  }

  // Comment 7: Quick update handler
  const handleQuickUpdate = async (id: string, patch: Partial<SessionResponse>) => {
    try {
      await updateSession(id, patch)
    } catch (error) {
      console.error('Failed to update session:', error)
      throw error
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedSession(undefined)
  }

  const handleBulkCreate = async (dto: BulkCreateSessionDto) => {
    try {
      const result = await bulkCreateSessions(dto)
      setBulkResult(result)
      setIsBulkFormOpen(false)
      refetch()
    } catch (err) {
      console.error('Bulk create failed:', err)
    }
  }

  const handleTemplateSaved = (template: TemplateResponse) => {
    console.log('Template saved:', template)
  }

  // Comment 8: Add to recent sessions when selecting from search
  const handleSelectSearchResult = (session: SessionResponse) => {
    addRecentSession(session)
    setSelectedSession(session)
    setIsFormOpen(true)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">Error loading sessions: {error.message}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sessions</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and track your learning sessions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all hover:scale-105 shadow-md"
            >
              <SearchIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Quick Search</span>
              <kbd className="hidden md:inline px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-600 rounded border border-gray-300 dark:border-gray-500">
                Ctrl+K
              </kbd>
            </button>
            <button
              onClick={() => setIsBulkFormOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all hover:scale-105 shadow-md"
            >
              <Upload className="h-5 w-5" />
              <span>Bulk Create</span>
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-all hover:scale-105 shadow-md hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* Bulk Result Summary */}
        {bulkResult && (
          <div className={`mb-6 p-4 rounded-lg border ${
            bulkResult.totalFailed === 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${
                  bulkResult.totalFailed === 0
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  Bulk Create Summary
                </h3>
                <p className={bulkResult.totalFailed === 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-yellow-700 dark:text-yellow-300'
                }>
                  Successfully created {bulkResult.totalCreated} session{bulkResult.totalCreated !== 1 ? 's' : ''}.
                  {bulkResult.totalFailed > 0 && ` ${bulkResult.totalFailed} failed.`}
                </p>
                {bulkResult.failed.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Failed sessions (showing first 5):
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300">
                      {bulkResult.failed.slice(0, 5).map((failure, idx) => (
                        <li key={idx}>
                          {failure.session.title || 'Untitled'}: {failure.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => setBulkResult(null)}
                className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={filters?.category || ''}
                onChange={(e) => updateFilters({ category: e.target.value as SessionCategory | undefined || undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                <option value="school">School</option>
                <option value="programming">Programming</option>
                <option value="language">Language</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters?.status?.[0] || ''}
                onChange={(e) => updateFilters({ status: e.target.value ? [e.target.value as SessionStatus] : undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={filters?.priority?.[0] || ''}
                onChange={(e) => updateFilters({ priority: e.target.value ? [e.target.value as SessionPriority] : undefined })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="date">Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="category">Category</option>
              </select>
            </div>

            {/* Group By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupOption)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="none">None</option>
                <option value="date">Date</option>
                <option value="status">Status</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonLoader variant="card" count={6} />
          </div>
        ) : processedSessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No sessions found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || filters?.category || filters?.status || filters?.priority
                ? 'Try adjusting your filters or search term'
                : 'Get started by creating your first learning session'}
            </p>
            {!searchTerm && !filters?.category && !filters?.status && !filters?.priority && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
              >
                Create Session
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([groupName, groupSessions]) => {
              // Skip if groupSessions is undefined or empty
              if (!groupSessions || groupSessions.length === 0) return null;

              return (
                <div key={groupName}>
                  {groupBy !== 'none' && (
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 animate-fade-in">
                      {groupName}
                      <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({groupSessions.length})
                      </span>
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupSessions
                      .filter((s): s is SessionResponse => s != null && !!s.category && !!s.status)
                      .map((session, index) => (
                        <div
                          key={session.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <SessionCard
                            session={session}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteSession}
                            onDuplicate={handleDuplicateSession}
                            onQuickUpdate={handleQuickUpdate}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedSession ? 'Edit Session' : 'Create Session'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SessionForm
                session={selectedSession}
                onSubmit={selectedSession
                  ? (data) => handleUpdateSession(selectedSession.id, data as UpdateSessionDto)
                  : (data) => handleCreateSession(data as CreateSessionDto)
                }
                onCancel={handleCloseForm}
                onTemplateSaved={handleTemplateSaved}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bulk Session Form Modal */}
      {isBulkFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Bulk Create Sessions
                </h2>
                <button
                  onClick={() => setIsBulkFormOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <BulkSessionForm
                onSubmit={handleBulkCreate}
                onCancel={() => setIsBulkFormOpen(false)}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SessionSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectSession={handleSelectSearchResult}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        shortcuts={shortcuts}
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  )
}

export default SessionsPage
