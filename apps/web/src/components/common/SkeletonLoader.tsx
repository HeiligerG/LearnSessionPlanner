interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'avatar' | 'list' | 'calendar';
  count?: number;
  className?: string;
  /** Use shimmer effect instead of pulse */
  shimmer?: boolean;
}

const shimmerClass = 'relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-shimmer';

export function SkeletonLoader({ variant = 'card', count = 1, className = '', shimmer = true }: SkeletonLoaderProps) {
  const baseSkeletonClass = shimmer ? shimmerClass : 'animate-pulse';

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
            <div className={`${baseSkeletonClass} space-y-4`}>
              <div className="flex items-center justify-between">
                <div className={`h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 ${shimmer ? 'overflow-hidden relative' : ''}`}>
                  {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                </div>
                <div className={`h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer ? 'overflow-hidden relative' : ''}`}>
                  {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                </div>
              </div>
              <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-full ${shimmer ? 'overflow-hidden relative' : ''}`}>
                {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
              </div>
              <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 ${shimmer ? 'overflow-hidden relative' : ''}`}>
                {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
              </div>
              <div className="flex gap-2 mt-4">
                <div className={`h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer ? 'overflow-hidden relative' : ''}`}>
                  {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                </div>
                <div className={`h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full ${shimmer ? 'overflow-hidden relative' : ''}`}>
                  {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                </div>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-full overflow-hidden relative ${shimmer ? '' : 'animate-pulse'}`}>
              {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
            </div>
            <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 overflow-hidden relative ${shimmer ? '' : 'animate-pulse'}`}>
              {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
            </div>
            <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 overflow-hidden relative ${shimmer ? '' : 'animate-pulse'}`}>
              {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
            </div>
          </div>
        );

      case 'avatar':
        return (
          <div className={`flex items-center gap-3 ${className}`}>
            <div className={`h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative ${shimmer ? '' : 'animate-pulse'}`}>
              {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
            </div>
            <div className="space-y-2 flex-1">
              <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 overflow-hidden relative ${shimmer ? '' : 'animate-pulse'}`}>
                {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
              </div>
              <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 overflow-hidden relative ${shimmer ? '' : 'animate-pulse'}`}>
                {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
              </div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className={`h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative ${shimmer ? '' : 'animate-pulse'}`}>
                  {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 overflow-hidden relative ${shimmer ? '' : 'animate-pulse'}`}>
                    {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                  </div>
                  <div className={`h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 overflow-hidden relative ${shimmer ? '' : 'animate-pulse'}`}>
                    {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'calendar':
        return (
          <div className={className}>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(35)].map((_, i) => (
                <div key={i} className={`h-20 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative ${shimmer ? '' : 'animate-pulse'}`}>
                  {shimmer && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
}
