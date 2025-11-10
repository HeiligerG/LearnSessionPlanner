import { CheckCircle, X } from 'lucide-react'
import type { SessionSuggestionDto } from '@repo/shared-types'
import { getCategoryIconComponent } from '@/utils/iconUtils'
import { Button } from '../common/Button'

interface SuggestionCardProps {
  suggestion: SessionSuggestionDto
  onAccept: (suggestion: SessionSuggestionDto) => void
  onDismiss: (suggestion: SessionSuggestionDto) => void
}

export function SuggestionCard({ suggestion, onAccept, onDismiss }: SuggestionCardProps) {
  const CategoryIcon = getCategoryIconComponent(suggestion.suggestedCategory)
  const confidenceColor =
    suggestion.confidence >= 0.8
      ? 'text-green-600 dark:text-green-400'
      : suggestion.confidence >= 0.6
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-gray-600 dark:text-gray-400'

  return (
    <div className="glass-card p-4 rounded-xl hover:scale-[1.02] transition-all duration-300 border border-gray-200 dark:border-gray-700">
      <div className="flex gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <CategoryIcon className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {suggestion.suggestedTitle}
          </h3>

          {/* Category and Duration */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 capitalize">
              {suggestion.suggestedCategory}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {suggestion.suggestedDuration} min
            </span>
          </div>

          {/* Tags */}
          {suggestion.suggestedTags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {suggestion.suggestedTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Reason */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
            {suggestion.reason}
          </p>

          {/* Confidence Indicator */}
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${confidenceColor.replace('text-', 'bg-')} transition-all duration-500`}
                  style={{ width: `${suggestion.confidence * 100}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${confidenceColor}`}>
                {Math.round(suggestion.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAccept(suggestion)}
              className="flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(suggestion)}
              className="flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
