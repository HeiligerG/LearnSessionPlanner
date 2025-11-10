import { Flame } from 'lucide-react'

interface StreakDisplayProps {
  currentStreak: number
  longestStreak: number
  size?: 'sm' | 'md' | 'lg'
}

export function StreakDisplay({ currentStreak, longestStreak, size = 'md' }: StreakDisplayProps) {
  const getMessage = () => {
    if (currentStreak === 0) return 'Start your streak!'
    if (currentStreak < 7) return 'Keep it up!'
    if (currentStreak < 30) return 'On fire!'
    return 'Legendary!'
  }

  const getNextMilestone = () => {
    if (currentStreak < 7) return 7
    if (currentStreak < 30) return 30
    if (currentStreak < 100) return 100
    return null
  }

  const nextMilestone = getNextMilestone()
  const daysToMilestone = nextMilestone ? nextMilestone - currentStreak : 0

  const sizeClasses = {
    sm: { container: 'p-4', icon: 'w-12 h-12', number: 'text-2xl', text: 'text-xs' },
    md: { container: 'p-6', icon: 'w-16 h-16', number: 'text-4xl', text: 'text-sm' },
    lg: { container: 'p-8', icon: 'w-20 h-20', number: 'text-5xl', text: 'text-base' },
  }

  const classes = sizeClasses[size]

  return (
    <div className={`glass-card ${classes.container} rounded-2xl`}>
      <div className="flex items-center gap-4">
        {/* Flame Icon */}
        <div
          className={`${classes.icon} flex items-center justify-center rounded-full ${
            currentStreak > 0
              ? 'bg-gradient-to-br from-orange-500 to-red-600 streak-flame animate-pulse'
              : 'bg-gray-300 dark:bg-gray-700'
          }`}
        >
          <Flame className={`${classes.icon} text-white`} />
        </div>

        {/* Stats */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`${classes.number} font-bold text-gray-900 dark:text-gray-100`}>
              {currentStreak}
            </span>
            <span className={`${classes.text} text-gray-600 dark:text-gray-400`}>day streak</span>
          </div>

          <p className={`${classes.text} text-gray-600 dark:text-gray-400 mt-1`}>
            {getMessage()}
          </p>

          {/* Longest Streak */}
          <div className={`${classes.text} text-gray-500 dark:text-gray-500 mt-2`}>
            Best: {longestStreak} days
          </div>

          {/* Progress to Next Milestone */}
          {nextMilestone && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Next milestone</span>
                <span>
                  {daysToMilestone} {daysToMilestone === 1 ? 'day' : 'days'} to {nextMilestone}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500"
                  style={{ width: `${(currentStreak / nextMilestone) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Dots (Last 7 Days) */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">Last 7 days</span>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => {
              // This is a simplified version - in real implementation,
              // you'd check actual completed sessions for each day
              const isActive = i < Math.min(currentStreak, 7)
              return (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    isActive
                      ? 'bg-gradient-to-br from-orange-500 to-red-600'
                      : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                  title={isActive ? 'Completed' : 'No activity'}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
