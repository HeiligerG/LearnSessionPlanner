import type { ProductivityMetricsDto } from '@repo/shared-types';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { getCategoryIconComponent } from '@/utils/iconUtils';

interface ProductivityMetricsProps {
  data: ProductivityMetricsDto | null;
  title?: string;
}

export default function ProductivityMetrics({
  data,
  title = 'Productivity Metrics',
}: ProductivityMetricsProps) {
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          No productivity metrics available
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIconComponent(data.mostProductiveCategory);

  // Determine icon for time of day based on exact value
  const isNightTime = data.mostProductiveTimeOfDay === 'evening';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{title}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Completion Rate"
          value={`${data.completionRate.toFixed(1)}%`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="success"
        />

        <StatsCard
          title="On-Time Completion"
          value={`${data.onTimeCompletionRate.toFixed(1)}%`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="info"
        />

        <StatsCard
          title="Average Delay"
          value={data.averageDelayDays.toFixed(1)}
          subtitle="days"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color={data.averageDelayDays > 1 ? 'warning' : 'success'}
        />

        <StatsCard
          title="Most Productive Category"
          value={data.mostProductiveCategory}
          icon={
            <CategoryIcon className="w-6 h-6" />
          }
          color="primary"
        />

        <StatsCard
          title="Best Time of Day"
          value={data.mostProductiveTimeOfDay}
          icon={
            isNightTime ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )
          }
          color="info"
        />

        <StatsCard
          title="Current Streak"
          value={data.streakDays}
          subtitle="days"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          }
          color="success"
        />
      </div>
    </div>
  );
}
