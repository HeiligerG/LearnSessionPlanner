import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { DetailedStatsDto } from '@repo/shared-types';
import { StatsCard } from '@/components/dashboard/StatsCard';
import CategoryChart from '@/components/statistics/CategoryChart';
import TrendChart from '@/components/statistics/TrendChart';
import TimeDistributionChart from '@/components/statistics/TimeDistributionChart';
import ProductivityMetrics from '@/components/statistics/ProductivityMetrics';
import { useSessions } from '@/hooks/useSessions';

export default function StatisticsPage() {
  const [stats, setStats] = useState<DetailedStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use sessions hook to detect when sessions change
  const { sessions } = useSessions();

  // Initialize date range to last 30 days
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDate(thirtyDaysAgo),
      end: formatDate(today),
    };
  };

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(getDefaultDateRange());

  useEffect(() => {
    fetchStats();
  }, [dateRange, sessions.length]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.sessions.getDetailedStats(
        dateRange.start || undefined,
        dateRange.end || undefined
      );
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch statistics'));
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const clearDateRange = () => {
    setDateRange({ start: '', end: '' });
  };

  const setQuickRange = (days: number | 'all') => {
    if (days === 'all') {
      setDateRange({ start: '', end: '' });
      return;
    }

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setDateRange({
      start: formatDate(startDate),
      end: formatDate(today),
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Statistics
        </h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Statistics
        </h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error loading statistics: {error.message}</p>
          <button
            onClick={fetchStats}
            className="mt-2 text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Statistics
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Analyze your learning patterns and progress
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Quick Range Buttons */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setQuickRange(7)}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              7d
            </button>
            <button
              onClick={() => setQuickRange(30)}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              30d
            </button>
            <button
              onClick={() => setQuickRange(90)}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              90d
            </button>
            <button
              onClick={() => setQuickRange('all')}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              All
            </button>
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Start date"
            />
            <span className="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="End date"
            />
          </div>
        </div>
      </div>

      {/* Overview Statistics */}
      {stats?.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Sessions"
            value={stats.overview.total}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            color="primary"
          />
          <StatsCard
            title="Completed"
            value={stats.overview.completed}
            subtitle={`${stats.overview.completionRate.toFixed(1)}% completion rate`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="success"
          />
          <StatsCard
            title="In Progress"
            value={stats.overview.inProgress}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            color="info"
          />
          <StatsCard
            title="Total Hours"
            value={`${(stats.overview.completedDuration / 60).toFixed(1)}h`}
            subtitle={`of ${(stats.overview.totalDuration / 60).toFixed(1)}h planned`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="warning"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart data={stats?.byCategory || []} />
        <TimeDistributionChart data={stats?.timeDistribution || null} />
      </div>

      {/* Trends Chart - Full Width */}
      {stats?.trends && stats.trends.length > 0 && (
        <TrendChart data={stats.trends} />
      )}

      {/* Productivity Metrics */}
      <ProductivityMetrics data={stats?.productivity || null} />
    </div>
  );
}
