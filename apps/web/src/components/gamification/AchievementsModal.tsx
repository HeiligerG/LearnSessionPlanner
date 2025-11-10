import { useState } from 'react'
import { X } from 'lucide-react'
import type { AchievementDto } from '@repo/shared-types'
import { AchievementCard } from './AchievementCard'

interface AchievementsModalProps {
  isOpen: boolean
  onClose: () => void
  achievements: AchievementDto[]
}

type FilterType = 'all' | 'unlocked' | 'locked'

export function AchievementsModal({ isOpen, onClose, achievements }: AchievementsModalProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  // Filter achievements
  const filteredAchievements = achievements.filter((achievement) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unlocked' && achievement.unlockedAt !== null) ||
      (filter === 'locked' && achievement.unlockedAt === null)

    const matchesSearch =
      searchQuery === '' ||
      achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // Group by category
  const categories = Array.from(new Set(achievements.map((a) => a.category)))
  const groupedAchievements = categories.map((category) => ({
    category,
    achievements: filteredAchievements.filter((a) => a.category === category),
  }))

  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length
  const totalCount = achievements.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Achievements
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            <div className="px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {unlockedCount}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                / {totalCount} unlocked
              </span>
            </div>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              {(['all', 'unlocked', 'locked'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    filter === f
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {groupedAchievements.map(
            ({ category, achievements: categoryAchievements }) =>
              categoryAchievements.length > 0 && (
                <div key={category} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              )
          )}

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No achievements found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
