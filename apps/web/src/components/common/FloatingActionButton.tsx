import { useState, useEffect } from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  position?: 'bottom-right' | 'bottom-left';
  show?: boolean;
  ariaLabel?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  show = true,
  ariaLabel,
}: FloatingActionButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Scale-in animation on mount
    if (show) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!show) return null;

  const positionClasses =
    position === 'bottom-left'
      ? 'bottom-6 left-6'
      : 'bottom-6 right-6';

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`
          fixed ${positionClasses} z-50
          w-14 h-14 rounded-full
          bg-primary-600 hover:bg-primary-700 active:bg-primary-800
          text-white shadow-lg hover:shadow-xl
          transition-all duration-200
          hover:scale-110 active:scale-95
          flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          animate-pulse-subtle
          ${isVisible ? 'animate-scale-in' : 'opacity-0'}
        `}
        aria-label={ariaLabel || label}
        type="button"
      >
        <span className="w-6 h-6">{icon}</span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={`
            fixed ${position === 'bottom-left' ? 'left-24' : 'right-24'} bottom-8 z-50
            px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg
            whitespace-nowrap animate-scale-in pointer-events-none
          `}
        >
          {label}
        </div>
      )}
    </div>
  );
}
