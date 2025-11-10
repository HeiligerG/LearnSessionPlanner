import { useState, useEffect, useRef } from 'react';

/**
 * Standard animation durations in milliseconds
 */
export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  countUp: 1500,
} as const;

/**
 * Easing function for natural deceleration
 */
const easeOutQuad = (t: number): number => {
  return t * (2 - t);
};

/**
 * Hook that animates a number from start to end value
 * @param end Target number to count up to
 * @param duration Animation duration in milliseconds
 * @param start Starting number (default: 0)
 * @returns Current animated value
 */
export function useCountUp(
  end: number,
  duration: number = ANIMATION_DURATIONS.countUp,
  start: number = 0
): number {
  const [count, setCount] = useState(start);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = undefined;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);
      const currentCount = start + (end - start) * easedProgress;

      setCount(currentCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, start]);

  return Math.round(count);
}

/**
 * Triggers a celebration animation on an element
 * @param element Optional element to animate (defaults to body)
 */
export function triggerCelebration(element?: HTMLElement): void {
  const target = element || document.body;

  // Add celebration class
  target.classList.add('animate-celebrate');

  // Create confetti effect
  createConfetti(target);

  // Remove class after animation
  setTimeout(() => {
    target.classList.remove('animate-celebrate');
  }, 1000);
}

/**
 * Creates confetti particles for celebration effect
 */
function createConfetti(container: HTMLElement): void {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-red-500',
  ];

  // Create 20 confetti particles
  for (let i = 0; i < 20; i++) {
    const confetti = document.createElement('div');
    confetti.className = `fixed w-2 h-2 rounded-full ${colors[i % colors.length]} pointer-events-none z-50`;

    // Random starting position near the element
    const rect = container.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    confetti.style.left = `${startX}px`;
    confetti.style.top = `${startY}px`;

    // Random animation properties
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const velocity = 50 + Math.random() * 100;
    const endX = startX + Math.cos(angle) * velocity;
    const endY = startY + Math.sin(angle) * velocity - 50; // Add upward bias

    document.body.appendChild(confetti);

    // Animate confetti
    const animation = confetti.animate([
      {
        transform: 'translate(0, 0) rotate(0deg) scale(1)',
        opacity: 1,
      },
      {
        transform: `translate(${endX - startX}px, ${endY - startY}px) rotate(${Math.random() * 720}deg) scale(0)`,
        opacity: 0,
      },
    ], {
      duration: 800 + Math.random() * 400,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    });

    // Clean up after animation
    animation.onfinish = () => {
      confetti.remove();
    };
  }
}

/**
 * Hook that returns true after a delay (useful for staggered animations)
 */
export function useDelayedValue(delay: number): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isReady;
}

/**
 * Hook for intersection observer-based animations
 */
export function useInView(options?: IntersectionObserverInit): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Only trigger once
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isInView];
}
