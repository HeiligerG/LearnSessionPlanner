interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

const colorClasses = {
  primary: 'bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300',
  success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
  warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
  danger: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
}: StatsCardProps) {
  const colorClass = colorClasses[color];

  return (
    <div className={`rounded-lg border-2 p-6 transition-all hover:shadow-md ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium uppercase tracking-wide opacity-70">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm opacity-60">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              {trend.direction === 'up' ? (
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span className={trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/50 dark:bg-black/20">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
