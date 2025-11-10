import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../common/Button'
import type { SessionStatus, SessionCategory, SessionPriority } from '@repo/shared-types'

interface BulkActionsBarProps {
  selectedCount: number
  onUpdateStatus: (status: SessionStatus) => void
  onUpdateCategory: (category: SessionCategory) => void
  onUpdatePriority: (priority: SessionPriority) => void
  onDelete: () => void
  onClearSelection: () => void
  onExport: (format: 'csv' | 'json') => void
}

export function BulkActionsBar({
  selectedCount,
  onUpdateStatus,
  onUpdateCategory,
  onUpdatePriority,
  onDelete,
  onClearSelection,
  onExport,
}: BulkActionsBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 shadow-lg animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedCount} selected
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
              >
                Update Status
              </Button>
              {showStatusMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px]">
                  {['planned', 'in_progress', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onUpdateStatus(status as SessionStatus)
                        setShowStatusMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 capitalize"
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              >
                Update Priority
              </Button>
              {showPriorityMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[150px]">
                  {['low', 'medium', 'high', 'urgent'].map((priority) => (
                    <button
                      key={priority}
                      onClick={() => {
                        onUpdatePriority(priority as SessionPriority)
                        setShowPriorityMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 capitalize"
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export
              </Button>
              {showExportMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
                  <button
                    onClick={() => {
                      onExport('csv')
                      setShowExportMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      onExport('json')
                      setShowExportMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export JSON
                  </button>
                </div>
              )}
            </div>

            {/* Delete Button */}
            <Button
              variant="danger"
              size="sm"
              onClick={onDelete}
            >
              Delete
            </Button>

            {/* Clear Selection */}
            <button
              onClick={onClearSelection}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
