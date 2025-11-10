import { TrendingUp } from 'lucide-react'

interface LevelProgressProps {
  level: number
  experiencePoints: number
  nextLevelThreshold: number
}

export function LevelProgress({
  level,
  experiencePoints,
  nextLevelThreshold,
}: LevelProgressProps) {
  const getLevelTitle = (lvl: number): string => {
    if (lvl <= 5) return 'Beginner'
    if (lvl <= 10) return 'Learner'
    if (lvl <= 20) return 'Scholar'
    if (lvl <= 50) return 'Expert'
    return 'Master'
  }

  const xpInCurrentLevel = experiencePoints % (level * 10 * 10)
  const xpNeededForLevel = level * 10 * 10
  const progress = (xpInCurrentLevel / xpNeededForLevel) * 100

  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-start justify-between mb-4">
        {/* Level Badge */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{level}</div>
              <div className="text-xs text-white/80">Level</div>
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md">
              {getLevelTitle(level)}
            </span>
          </div>
        </div>

        {/* XP Stats */}
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {experiencePoints.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total XP</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress to Level {level + 1}</span>
          <span>
            {xpInCurrentLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP
          </span>
        </div>
        <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 transition-all duration-500 relative"
            style={{ width: `${progress}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Milestone Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{level}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Current</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{level + 1}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Next</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {Math.ceil((xpNeededForLevel - xpInCurrentLevel) / 10)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Sessions needed</div>
          </div>
        </div>
      </div>
    </div>
  )
}
