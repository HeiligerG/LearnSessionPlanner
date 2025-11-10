import React, { useState, useMemo, useEffect } from 'react'
import { Plus, Upload, Search as SearchIcon, ArrowUp, X, CheckSquare } from 'lucide-react'
import type { SessionResponse, SessionStatus, SessionPriority, SessionCategory, CreateSessionDto, UpdateSessionDto, BulkCreateSessionDto, BulkCreateResult, TemplateResponse } from '@repo/shared-types'
import { useSessions } from '@/hooks/useSessions'
import { useBulkSelection } from '@/hooks/useBulkSelection'
import { useRecentSessions } from '@/hooks/useRecentSessions'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useGlobalShortcuts } from '@/contexts/GlobalShortcutsContext'
import { SessionCard } from '@/components/sessions/SessionCard'
import { SessionForm } from '@/components/sessions/SessionForm'
import { BulkSessionForm } from '@/components/sessions/BulkSessionForm'
import { SessionSearchModal } from '@/components/sessions/SessionSearchModal'
import { BulkActionsBar } from '@/components/sessions/BulkActionsBar'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { KeyboardShortcutsHelp } from '@/components/common/KeyboardShortcutsHelp'
import { EmptyState } from '@/components/common/EmptyState'
import { FilterChip } from '@/components/common/FilterChip'
import { useToast, useToastConfirm } from '@/contexts/ToastContext'
import { filterSessions, sortSessions, groupSessionsByDate } from '@/utils/sessionUtils'
import { downloadBlob } from '@/utils/exportUtils'
import { api } from '@/services/api'
import { BookOpen } from 'lucide-react'

// Simple error boundary for session rendering
const SessionErrorBoundary: React.FC<{ children: React.ReactNode; sessionId?: string }> = ({ children, sessionId }) => {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="rounded-xl border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20 p-4">
        <div className="text-red-700 dark:text-red-300 text-sm">
          Error rendering session {sessionId ? `(${sessionId})` : ''}
        </div>
      </div>
    )
  }

  try {
    return <>{children}</>
  } catch (error: any) {
    console.error('Session rendering error:', error)
    setHasError(true)
    return (
      <div className="rounded-xl border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20 p-4">
        <div className="text-red-700 dark:text-red-300 text-sm">
          Error rendering session {sessionId ? `(${sessionId})` : ''}
        </div>
      </div>
    )
  }
}

type SortOption = 'date' | 'priority' | 'status' | 'category'
type GroupOption = 'none' | 'date' | 'status' | 'category'

const SessionsPage: React.FC = () => {
  const toast = useToast()
  const confirm = useToastConfirm()
  const { sessions: rawSessions, loading, error, createSession, bulkCreateSessions, updateSession, deleteSession, refetch, updateFilters, filters } = useSessions()
  const { addRecentSession } = useRecentSessions()
  const { registerShortcut, unregisterShortcut } = useGlobalShortcuts()

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
  const [lastInteractedSession, setLastInteractedSession] = useState<SessionResponse | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [groupBy, setGroupBy] = useState<GroupOption>('date')
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const {
    selectedIds,
    selectedCount,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection,
  } = useBulkSelection()

  // Track scroll position for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  // Comment 1 & 2: Register Ctrl+D global shortcut for duplication
  useEffect(() => {
    if (sessions.length > 0) {
      registerShortcut('duplicate-session', {
        key: 'D',
        ctrlKey: true,
        description: 'Duplicate selected session',
        action: () => {
          if (lastInteractedSession) {
            // Duplicate the session
            const duplicateDto = {
              title: lastInteractedSession.title,
              description: lastInteractedSession.description,
              category: lastInteractedSession.category,
              priority: lastInteractedSession.priority,
              duration: lastInteractedSession.duration,
              tags: lastInteractedSession.tags,
              notes: lastInteractedSession.notes,
              status: 'planned' as const,
            };

            createSession(duplicateDto)
              .then(() => {
                toast.success('Session duplicated successfully');
                setLastInteractedSession(null);
              })
              .catch((error) => {
                console.error('Failed to duplicate session:', error);
                toast.error('Failed to duplicate session');
              });
          } else {
            toast.warning('No session selected. Click a session first.');
          }
        },
      });
    }

    return () => {
      unregisterShortcut('duplicate-session');
    };
  }, [sessions.length, lastInteractedSession, registerShortcut, unregisterShortcut, createSession, toast]);

  // Apply search filter to the sessions
  const filteredSessions = useMemo(() => {
    // Filter out any null/undefined sessions first
    let result = sessions.filter(s => s != null)

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(s =>
        s.title?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term) ||
        s.tags?.some(tag => tag.toLowerCase().includes(term))
      )
    }

    return result
  }, [sessions, searchTerm])

  // Apply sorting to filtered sessions
  const processedSessions = useMemo(() => {
    return sortSessions(filteredSessions, sortBy === 'date' ? 'scheduledFor' : sortBy)
  }, [filteredSessions, sortBy])

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
    // Comment 1 & 2: Track last interacted session for Ctrl+D
    setLastInteractedSession(session)
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

  // Bulk operation handlers
  const handleBulkUpdateStatus = async (status: SessionStatus) => {
    try {
      const response = await api.sessions.bulkUpdate({
        sessionIds: selectedIds,
        updates: { status },
      })
      toast.success(`${response.data?.successful.length || 0} sessions updated`)
      clearSelection()
      refetch()
    } catch (error) {
      toast.error('Failed to update sessions')
    }
  }

  const handleBulkUpdateCategory = async (category: SessionCategory) => {
    try {
      const response = await api.sessions.bulkUpdate({
        sessionIds: selectedIds,
        updates: { category },
      })
      toast.success(`${response.data?.successful.length || 0} sessions updated`)
      clearSelection()
      refetch()
    } catch (error) {
      toast.error('Failed to update sessions')
    }
  }

  const handleBulkUpdatePriority = async (priority: SessionPriority) => {
    try {
      const response = await api.sessions.bulkUpdate({
        sessionIds: selectedIds,
        updates: { priority },
      })
      toast.success(`${response.data?.successful.length || 0} sessions updated`)
      clearSelection()
      refetch()
    } catch (error) {
      toast.error('Failed to update sessions')
    }
  }

  const handleBulkDelete = async () => {
    const confirmed = await confirm(`Are you sure you want to delete ${selectedCount} sessions?`)
    if (confirmed) {
      try {
        const response = await api.sessions.bulkDelete(selectedIds)
        toast.success(`${response.data?.successful.length || 0} sessions deleted`)
        clearSelection()
        refetch()
      } catch (error) {
        toast.error('Failed to delete sessions')
      }
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await api.sessions.exportSessions(format, filters)
      const filename = `sessions-export-${new Date().toISOString().split('T')[0]}.${format}`
      downloadBlob(blob, filename)
      toast.success(`Exported ${format.toUpperCase()} successfully`)
    } catch (error) {
      toast.error('Failed to export sessions')
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
              onClick={() => {
                setSelectionMode(!selectionMode)
                if (selectionMode) clearSelection()
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-all hover:scale-105 shadow-md ${
                selectionMode
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <CheckSquare className="h-5 w-5" />
              <span>{selectionMode ? 'Exit Selection' : 'Select'}</span>
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
        <div className="glass-card p-6 mb-6 animate-fade-in">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Category Filters */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
              <FilterChip
                label="All"
                value="all"
                isActive={!filters?.category}
                onToggle={() => updateFilters({ category: undefined })}
              />
              <FilterChip
                label="School"
                value="school"
                variant="category"
                isActive={filters?.category === 'school'}
                onToggle={() => updateFilters({ category: filters?.category === 'school' ? undefined : 'school' as SessionCategory })}
              />
              <FilterChip
                label="Programming"
                value="programming"
                variant="category"
                isActive={filters?.category === 'programming'}
                onToggle={() => updateFilters({ category: filters?.category === 'programming' ? undefined : 'programming' as SessionCategory })}
              />
              <FilterChip
                label="Language"
                value="language"
                variant="category"
                isActive={filters?.category === 'language'}
                onToggle={() => updateFilters({ category: filters?.category === 'language' ? undefined : 'language' as SessionCategory })}
              />
              <FilterChip
                label="Personal"
                value="personal"
                variant="category"
                isActive={filters?.category === 'personal'}
                onToggle={() => updateFilters({ category: filters?.category === 'personal' ? undefined : 'personal' as SessionCategory })}
              />
              <FilterChip
                label="Other"
                value="other"
                variant="category"
                isActive={filters?.category === 'other'}
                onToggle={() => updateFilters({ category: filters?.category === 'other' ? undefined : 'other' as SessionCategory })}
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
              <FilterChip
                label="All"
                value="all"
                isActive={!filters?.status || filters.status.length === 0}
                onToggle={() => updateFilters({ status: undefined })}
              />
              <FilterChip
                label="Planned"
                value="planned"
                variant="status"
                isActive={filters?.status?.includes('planned')}
                onToggle={() => {
                  const newStatus = filters?.status?.includes('planned')
                    ? (filters.status as SessionStatus[]).filter(s => s !== 'planned')
                    : [...(filters?.status || []), 'planned'];
                  updateFilters({ status: newStatus.length ? newStatus as SessionStatus[] : undefined });
                }}
              />
              <FilterChip
                label="In Progress"
                value="in_progress"
                variant="status"
                isActive={filters?.status?.includes('in_progress')}
                onToggle={() => {
                  const newStatus = filters?.status?.includes('in_progress')
                    ? (filters.status as SessionStatus[]).filter(s => s !== 'in_progress')
                    : [...(filters?.status || []), 'in_progress'];
                  updateFilters({ status: newStatus.length ? newStatus as SessionStatus[] : undefined });
                }}
              />
              <FilterChip
                label="Completed"
                value="completed"
                variant="status"
                isActive={filters?.status?.includes('completed')}
                onToggle={() => {
                  const newStatus = filters?.status?.includes('completed')
                    ? (filters.status as SessionStatus[]).filter(s => s !== 'completed')
                    : [...(filters?.status || []), 'completed'];
                  updateFilters({ status: newStatus.length ? newStatus as SessionStatus[] : undefined });
                }}
              />
              <FilterChip
                label="Missed"
                value="missed"
                variant="status"
                isActive={filters?.status?.includes('missed')}
                onToggle={() => {
                  const newStatus = filters?.status?.includes('missed')
                    ? (filters.status as SessionStatus[]).filter(s => s !== 'missed')
                    : [...(filters?.status || []), 'missed'];
                  updateFilters({ status: newStatus.length ? newStatus as SessionStatus[] : undefined });
                }}
              />
              <FilterChip
                label="Cancelled"
                value="cancelled"
                variant="status"
                isActive={filters?.status?.includes('cancelled')}
                onToggle={() => {
                  const newStatus = filters?.status?.includes('cancelled')
                    ? (filters.status as SessionStatus[]).filter(s => s !== 'cancelled')
                    : [...(filters?.status || []), 'cancelled'];
                  updateFilters({ status: newStatus.length ? newStatus as SessionStatus[] : undefined });
                }}
              />
            </div>
          </div>

          {/* Priority Filters */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
              <FilterChip
                label="All"
                value="all"
                isActive={!filters?.priority || filters.priority.length === 0}
                onToggle={() => updateFilters({ priority: undefined })}
              />
              <FilterChip
                label="Low"
                value="low"
                variant="priority"
                isActive={filters?.priority?.includes('low')}
                onToggle={() => {
                  const newPriority = filters?.priority?.includes('low')
                    ? (filters.priority as SessionPriority[]).filter(p => p !== 'low')
                    : [...(filters?.priority || []), 'low'];
                  updateFilters({ priority: newPriority.length ? newPriority as SessionPriority[] : undefined });
                }}
              />
              <FilterChip
                label="Medium"
                value="medium"
                variant="priority"
                isActive={filters?.priority?.includes('medium')}
                onToggle={() => {
                  const newPriority = filters?.priority?.includes('medium')
                    ? (filters.priority as SessionPriority[]).filter(p => p !== 'medium')
                    : [...(filters?.priority || []), 'medium'];
                  updateFilters({ priority: newPriority.length ? newPriority as SessionPriority[] : undefined });
                }}
              />
              <FilterChip
                label="High"
                value="high"
                variant="priority"
                isActive={filters?.priority?.includes('high')}
                onToggle={() => {
                  const newPriority = filters?.priority?.includes('high')
                    ? (filters.priority as SessionPriority[]).filter(p => p !== 'high')
                    : [...(filters?.priority || []), 'high'];
                  updateFilters({ priority: newPriority.length ? newPriority as SessionPriority[] : undefined });
                }}
              />
              <FilterChip
                label="Urgent"
                value="urgent"
                variant="priority"
                isActive={filters?.priority?.includes('urgent')}
                onToggle={() => {
                  const newPriority = filters?.priority?.includes('urgent')
                    ? (filters.priority as SessionPriority[]).filter(p => p !== 'urgent')
                    : [...(filters?.priority || []), 'urgent'];
                  updateFilters({ priority: newPriority.length ? newPriority as SessionPriority[] : undefined });
                }}
              />
            </div>
          </div>

          {/* Sort and Group Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="Date"
                  value="date"
                  isActive={sortBy === 'date'}
                  onToggle={() => setSortBy('date')}
                />
                <FilterChip
                  label="Priority"
                  value="priority"
                  isActive={sortBy === 'priority'}
                  onToggle={() => setSortBy('priority')}
                />
                <FilterChip
                  label="Status"
                  value="status"
                  isActive={sortBy === 'status'}
                  onToggle={() => setSortBy('status')}
                />
                <FilterChip
                  label="Category"
                  value="category"
                  isActive={sortBy === 'category'}
                  onToggle={() => setSortBy('category')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Group By
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="None"
                  value="none"
                  isActive={groupBy === 'none'}
                  onToggle={() => setGroupBy('none')}
                />
                <FilterChip
                  label="Date"
                  value="date"
                  isActive={groupBy === 'date'}
                  onToggle={() => setGroupBy('date')}
                />
                <FilterChip
                  label="Status"
                  value="status"
                  isActive={groupBy === 'status'}
                  onToggle={() => setGroupBy('status')}
                />
                <FilterChip
                  label="Category"
                  value="category"
                  isActive={groupBy === 'category'}
                  onToggle={() => setGroupBy('category')}
                />
              </div>
            </div>
          </div>

          {/* Active Filters Summary & Clear All */}
          {(filters?.category || (filters?.status && filters.status.length > 0) || (filters?.priority && filters.priority.length > 0)) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {(() => {
                  let count = 0
                  if (filters?.category) count++
                  if (filters?.status && filters.status.length > 0) count++
                  if (filters?.priority && filters.priority.length > 0) count++
                  return `${count} filter${count !== 1 ? 's' : ''} active`
                })()}
              </span>
              <button
                onClick={() => updateFilters({ category: undefined, status: undefined, priority: undefined })}
                className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonLoader variant="card" count={6} />
          </div>
        ) : processedSessions.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No sessions found"
            description={
              searchTerm || filters?.category || filters?.status || filters?.priority
                ? 'Try adjusting your filters or search term'
                : 'Get started by creating your first learning session'
            }
            illustration="sessions"
            action={
              !searchTerm && !filters?.category && !filters?.status && !filters?.priority
                ? {
                    label: 'Create First Session',
                    onClick: () => setIsFormOpen(true),
                  }
                : undefined
            }
          />
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
                            selectionMode={selectionMode}
                            isSelected={isSelected(session.id)}
                            onToggleSelection={toggleSelection}
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

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-all hover:scale-110 active:scale-95 z-40 animate-slide-up"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
      {/* Bulk Actions Bar */}
      {hasSelection && (
        <BulkActionsBar
          selectedCount={selectedCount}
          onUpdateStatus={handleBulkUpdateStatus}
          onUpdateCategory={handleBulkUpdateCategory}
          onUpdatePriority={handleBulkUpdatePriority}
          onDelete={handleBulkDelete}
          onClearSelection={clearSelection}
          onExport={handleExport}
        />
      )}
    </div>
  )
}

export default SessionsPage
