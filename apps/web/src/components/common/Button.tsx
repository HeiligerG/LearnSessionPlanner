import { forwardRef, ButtonHTMLAttributes, ReactNode, MouseEvent, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  /** Enable ripple effect on click */
  ripple?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      ripple = true,
      children,
      className = '',
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    // Ripple effect handler
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !loading) {
        const button = buttonRef.current || (ref && typeof ref !== 'function' ? ref.current : null);
        if (button) {
          const rect = button.getBoundingClientRect();
          const rippleElement = document.createElement('span');
          const size = Math.max(rect.width, rect.height);
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;

          rippleElement.style.width = rippleElement.style.height = `${size}px`;
          rippleElement.style.left = `${x}px`;
          rippleElement.style.top = `${y}px`;
          rippleElement.className = 'ripple';

          button.appendChild(rippleElement);

          setTimeout(() => {
            rippleElement.remove();
          }, 600);
        }
      }

      if (onClick) {
        onClick(e);
      }
    };

    const baseClasses = 'relative inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95 hover:scale-[1.02] touch-target';

    const variantClasses = {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white focus-visible:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-700 hover-glow',
      secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white focus-visible:ring-gray-500',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus-visible:ring-gray-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500 dark:bg-red-600 dark:hover:bg-red-700 hover-glow',
      success: 'bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-500 dark:bg-green-600 dark:hover:bg-green-700 hover-glow',
      gradient: 'bg-gradient-to-br from-primary-500 via-purple-500 to-primary-700 hover:from-primary-600 hover:via-purple-600 hover:to-primary-800 text-white focus-visible:ring-primary-500 bg-size-200 animate-gradient-x hover-glow',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm min-h-[36px]',
      md: 'px-4 py-2 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[52px]',
    };

    const widthClass = fullWidth ? 'w-full' : '';
    const shimmerClass = loading ? 'animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-size-200' : '';

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${shimmerClass} ${className}`.trim();

    const setRefs = (el: HTMLButtonElement | null) => {
      buttonRef.current = el;
      if (typeof ref === 'function') {
        ref(el);
      } else if (ref) {
        ref.current = el;
      }
    };

    return (
      <button
        ref={setRefs}
        className={classes}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          <span className="inline-flex">{icon}</span>
        ) : null}
        {children}
        {!loading && iconRight && (
          <span className="inline-flex">{iconRight}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
export { Button };
