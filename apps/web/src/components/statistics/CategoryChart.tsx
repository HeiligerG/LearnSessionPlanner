import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { CategoryStatsDto } from '@repo/shared-types';
import { getCategoryIconComponent } from '@/utils/iconUtils';

interface CategoryChartProps {
  data: CategoryStatsDto[] | null;
  title?: string;
}

const COLORS = ['#6366f1', '#10b981', '#a855f7', '#f59e0b', '#6b7280'];

export default function CategoryChart({ data, title = 'Category Breakdown' }: CategoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
          No category data available
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category,
    value: item.totalSessions,
    completionRate: item.completionRate,
    completed: item.completedSessions,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 dark:text-white capitalize">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total: {data.value} sessions</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed: {data.completed}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Completion Rate: {data.completionRate.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const categoryName = entry.payload?.name || entry.value;
          const CategoryIcon = getCategoryIconComponent(categoryName);
          return (
            <li key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <div className="flex items-center gap-1">
                <CategoryIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {categoryName}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
