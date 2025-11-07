import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TimeDistributionDto } from '@repo/shared-types';
import { formatDuration } from '@/utils/dateUtils';

interface TimeDistributionChartProps {
  data: TimeDistributionDto | null;
  title?: string;
}

export default function TimeDistributionChart({
  data,
  title = 'Time Distribution',
}: TimeDistributionChartProps) {
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          No time distribution data available
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 dark:text-white">{data.payload.day}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.value.toFixed(2)} hours
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Planned</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.totalPlannedHours.toFixed(1)}h
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Completed</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            {data.totalCompletedHours.toFixed(1)}h
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Duration</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDuration(data.averageSessionDuration)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Longest</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDuration(data.longestSession)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Shortest</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatDuration(data.shortestSession)}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.byDayOfWeek} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="day"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
