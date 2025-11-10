import { Trophy, Star, Flame, Target, Award, Zap } from 'lucide-react'
import type { AchievementDto } from '@repo/shared-types'

interface AchievementCardProps {
  achievement: AchievementDto
  size?: 'sm' | 'md' | 'lg'
}

const iconMap: Record<string, any> = {
  Trophy,
  Star,
  Flame,
  Target,
  Award,
  Zap,
}

export function AchievementCard({ achievement, size = 'md' }: AchievementCardProps) {
  const Icon = iconMap[achievement.icon] || Trophy
  const isUnlocked = achievement.unlockedAt !== null

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <div
      className={`relative p-4 rounded-xl transition-all duration-300 ${
        isUnlocked
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 achievement-glow'
          : 'bg-gray-100 dark:bg-gray-800 opacity-60'
      } hover:scale-105 ${isUnlocked ? 'hover:achievement-glow' : ''}`}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Icon */}
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
            isUnlocked
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}
        >
          <Icon className={iconSizes[size]} />
        </div>

        {/* Name */}
        <div className="text-center">
          <h3
            className={`font-semibold ${
              size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
            } ${isUnlocked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}
          >
            {achievement.name}
          </h3>
          <p
            className={`${
              size === 'sm' ? 'text-xs' : 'text-sm'
            } text-gray-600 dark:text-gray-400 mt-1`}
          >
            {achievement.description}
          </p>
        </div>

        {/* Progress or Unlock Date */}
        {isUnlocked ? (
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}
          </div>
        ) : (
          <div className="w-full">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(achievement.progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300">
            {achievement.category}
          </span>
        </div>
      </div>
    </div>
  )
}
