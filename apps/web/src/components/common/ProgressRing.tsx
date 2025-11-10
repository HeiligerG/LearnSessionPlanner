interface ProgressRingProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Ring diameter in pixels */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Color theme */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Show percentage text in center */
  showPercentage?: boolean;
  /** Animate progress changes */
  animated?: boolean;
  /** Optional label */
  label?: string;
}

/**
 * Circular progress indicator with gradient support
 */
export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'primary',
  showPercentage = true,
  animated = true,
  label,
}: ProgressRingProps) {
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Color configurations with gradients
  const colorConfig = {
    primary: {
      gradient: 'url(#gradient-primary)',
      from: '#6366f1',
      to: '#8b5cf6',
      glow: 'rgba(99, 102, 241, 0.3)',
    },
    success: {
      gradient: 'url(#gradient-success)',
      from: '#10b981',
      to: '#059669',
      glow: 'rgba(16, 185, 129, 0.3)',
    },
    warning: {
      gradient: 'url(#gradient-warning)',
      from: '#f59e0b',
      to: '#d97706',
      glow: 'rgba(245, 158, 11, 0.3)',
    },
    danger: {
      gradient: 'url(#gradient-danger)',
      from: '#ef4444',
      to: '#dc2626',
      glow: 'rgba(239, 68, 68, 0.3)',
    },
    info: {
      gradient: 'url(#gradient-info)',
      from: '#3b82f6',
      to: '#2563eb',
      glow: 'rgba(59, 130, 246, 0.3)',
    },
  };

  const config = colorConfig[color];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className={animated ? 'transform -rotate-90' : 'transform -rotate-90'}
      >
        {/* Define gradient */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={config.from} />
            <stop offset="100%" stopColor={config.to} />
          </linearGradient>
          {/* Glow filter */}
          <filter id={`glow-${color}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={config.gradient}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={animated ? 'transition-all duration-1000 ease-out' : ''}
          filter={`url(#glow-${color})`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(progress)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Mini progress ring for compact spaces
 */
export function MiniProgressRing({ progress, color = 'primary' }: { progress: number; color?: ProgressRingProps['color'] }) {
  return (
    <ProgressRing
      progress={progress}
      size={40}
      strokeWidth={4}
      color={color}
      showPercentage={false}
      animated={true}
    />
  );
}
