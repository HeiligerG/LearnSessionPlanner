import { Lightbulb, TrendingUp, AlertCircle, Info } from 'lucide-react'
import type { DetailedStatsDto } from '@repo/shared-types'
import { Button } from '../common/Button'

interface InsightsPanelProps {
  stats: DetailedStatsDto
  onScheduleSession?: () => void
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'tip'
  icon: any
  title: string
  message: string
  action?: { label: string; onClick: () => void }
}

export function InsightsPanel({ stats, onScheduleSession }: InsightsPanelProps) {
  const insights: Insight[] = []

  // Most productive time
  if (stats.productivity.mostProductiveTimeOfDay) {
    insights.push({
      type: 'success',
      icon: TrendingUp,
      title: 'Peak Performance Time',
      message: `Your most productive time is ${stats.productivity.mostProductiveTimeOfDay}. Schedule important sessions during this window for best results.`,
      action: onScheduleSession
        ? { label: 'Schedule Now', onClick: onScheduleSession }
        : undefined,
    })
  }

  // Completion rate feedback
  if (stats.productivity.completionRate < 0.5) {
    insights.push({
      type: 'warning',
      icon: AlertCircle,
      title: 'Low Completion Rate',
      message: `You're completing ${(stats.productivity.completionRate * 100).toFixed(0)}% of sessions. Consider scheduling fewer sessions or breaking them into smaller chunks.`,
    })
  } else if (stats.productivity.completionRate >= 0.8) {
    insights.push({
      type: 'success',
      icon: TrendingUp,
      title: 'Excellent Completion Rate',
      message: `You're completing ${(stats.productivity.completionRate * 100).toFixed(0)}% of sessions! Your planning and execution are on point.`,
    })
  }

  // On-time completion
  if (stats.productivity.onTimeCompletionRate < 0.6) {
    insights.push({
      type: 'info',
      icon: Info,
      title: 'Schedule Optimization',
      message: `Only ${(stats.productivity.onTimeCompletionRate * 100).toFixed(0)}% of sessions are completed on time. Try adding buffer time or adjusting your schedule.`,
    })
  }

  // Best performing category
  if (stats.byCategory.length > 0) {
    const bestCategory = stats.byCategory.reduce((best, cat) =>
      cat.completionRate > best.completionRate ? cat : best
    )
    if (bestCategory.completionRate > 0.7) {
      insights.push({
        type: 'tip',
        icon: Lightbulb,
        title: 'Category Strength',
        message: `Your ${bestCategory.category} sessions have a ${(bestCategory.completionRate * 100).toFixed(0)}% completion rate. Apply these successful habits to other categories!`,
      })
    }
  }

  // Neglected categories
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  stats.byCategory.forEach((cat) => {
    if (cat.totalSessions === 0) {
      insights.push({
        type: 'info',
        icon: Info,
        title: 'Unexplored Category',
        message: `You haven't scheduled any ${cat.category} sessions yet. Consider exploring this area of learning.`,
        action: onScheduleSession
          ? { label: 'Schedule Now', onClick: onScheduleSession }
          : undefined,
      })
    }
  })

  // Average duration insights
  if (stats.timeDistribution.averageSessionDuration > 180) {
    insights.push({
      type: 'tip',
      icon: Lightbulb,
      title: 'Session Length',
      message: `Your average session is ${Math.round(stats.timeDistribution.averageSessionDuration)} minutes. Breaking into shorter sessions (60-90 min) might improve focus and completion rates.`,
    })
  }

  // Streak encouragement
  if (stats.productivity.streakDays > 0) {
    insights.push({
      type: 'success',
      icon: TrendingUp,
      title: 'Consistency Streak',
      message: `You're on a ${stats.productivity.streakDays}-day streak! Keep the momentum going.`,
    })
  } else {
    insights.push({
      type: 'tip',
      icon: Lightbulb,
      title: 'Build Consistency',
      message: "Complete a session today to start your streak! Consistency is key to long-term learning success.",
      action: onScheduleSession
        ? { label: 'Start Now', onClick: onScheduleSession }
        : undefined,
    })
  }

  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-900 dark:text-green-100',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-900 dark:text-yellow-100',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-100',
    },
    tip: {
      bg: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
      title: 'text-purple-900 dark:text-purple-100',
    },
  }

  // Limit to top 5 insights
  const displayInsights = insights.slice(0, 5)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        Insights & Recommendations
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {displayInsights.map((insight, index) => {
          const styles = typeStyles[insight.type]
          const Icon = insight.icon

          return (
            <div
              key={index}
              className={`p-4 rounded-xl border ${styles.bg} transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Icon className={`w-5 h-5 ${styles.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm ${styles.title}`}>{insight.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {insight.message}
                  </p>
                  {insight.action && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={insight.action.onClick}
                      className="mt-3"
                    >
                      {insight.action.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {displayInsights.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Complete more sessions to unlock personalized insights!</p>
        </div>
      )}
    </div>
  )
}
