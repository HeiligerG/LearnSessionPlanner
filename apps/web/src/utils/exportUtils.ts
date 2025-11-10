import type { SessionResponse, DetailedStatsDto } from '@repo/shared-types'

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * Format sessions as CSV
 */
export function formatSessionsAsCSV(sessions: SessionResponse[]): string {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Category',
    'Status',
    'Priority',
    'Duration (min)',
    'Actual Duration (min)',
    'Scheduled For',
    'Started At',
    'Completed At',
    'Tags',
    'Notes',
    'Created At',
  ]

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  let csv = headers.join(',') + '\n'

  for (const session of sessions) {
    const row = [
      escapeCSV(session.id),
      escapeCSV(session.title),
      escapeCSV(session.description),
      escapeCSV(session.category),
      escapeCSV(session.status),
      escapeCSV(session.priority),
      escapeCSV(session.duration),
      escapeCSV(session.actualDuration),
      escapeCSV(session.scheduledFor),
      escapeCSV(session.startedAt),
      escapeCSV(session.completedAt),
      escapeCSV(session.tags.join('; ')),
      escapeCSV(session.notes),
      escapeCSV(session.createdAt),
    ]
    csv += row.join(',') + '\n'
  }

  return csv
}

/**
 * Format sessions as JSON
 */
export function formatSessionsAsJSON(sessions: SessionResponse[]): string {
  return JSON.stringify(sessions, null, 2)
}

/**
 * Format statistics as CSV
 */
export function formatStatsAsCSV(stats: DetailedStatsDto): string {
  const lines: string[] = []

  // Overview
  lines.push('OVERVIEW')
  lines.push('Metric,Value')
  lines.push(`Total Sessions,${stats.overview.total}`)
  lines.push(`Completed,${stats.overview.completed}`)
  lines.push(`In Progress,${stats.overview.inProgress}`)
  lines.push(`Missed,${stats.overview.missed}`)
  lines.push(`Planned,${stats.overview.planned}`)
  lines.push(`Total Duration (min),${stats.overview.totalDuration}`)
  lines.push(`Completed Duration (min),${stats.overview.completedDuration}`)
  lines.push(`Completion Rate,${(stats.overview.completionRate * 100).toFixed(2)}%`)
  lines.push('')

  // Category Stats
  lines.push('CATEGORY STATISTICS')
  lines.push('Category,Total Sessions,Completed Sessions,Total Duration (min),Completed Duration (min),Completion Rate')
  for (const cat of stats.byCategory) {
    lines.push(
      `${cat.category},${cat.totalSessions},${cat.completedSessions},${cat.totalDuration},${cat.completedDuration},${(cat.completionRate * 100).toFixed(2)}%`
    )
  }
  lines.push('')

  // Productivity Metrics
  lines.push('PRODUCTIVITY METRICS')
  lines.push('Metric,Value')
  lines.push(`Completion Rate,${(stats.productivity.completionRate * 100).toFixed(2)}%`)
  lines.push(`On-Time Completion Rate,${(stats.productivity.onTimeCompletionRate * 100).toFixed(2)}%`)
  lines.push(`Average Delay (days),${stats.productivity.averageDelayDays.toFixed(2)}`)
  lines.push(`Most Productive Category,${stats.productivity.mostProductiveCategory}`)
  lines.push(`Most Productive Time,${stats.productivity.mostProductiveTimeOfDay}`)
  lines.push(`Current Streak (days),${stats.productivity.streakDays}`)
  lines.push('')

  // Time Distribution
  lines.push('TIME DISTRIBUTION')
  lines.push('Day of Week,Hours')
  for (const day of stats.timeDistribution.byDayOfWeek) {
    lines.push(`${day.day},${day.hours}`)
  }

  return lines.join('\n')
}
