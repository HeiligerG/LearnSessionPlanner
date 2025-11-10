import type { SessionCategory } from '@repo/shared-types';

/**
 * Style configuration for each category
 */
export interface CategoryStyle {
  /** Tailwind gradient classes for background */
  gradient: string;
  /** Background color for icon container */
  iconBg: string;
  /** Color for icon */
  iconColor: string;
  /** Border color for accents */
  borderColor: string;
  /** Light background for subtle uses */
  lightBg: string;
  /** Text color */
  textColor: string;
}

/**
 * Category style configurations with gradients and colors
 */
export const categoryStyles: Record<SessionCategory, CategoryStyle> = {
  school: {
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  programming: {
    gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500',
    lightBg: 'bg-purple-50 dark:bg-purple-950',
    textColor: 'text-purple-700 dark:text-purple-300',
  },
  language: {
    gradient: 'bg-gradient-to-br from-green-500 to-green-700',
    iconBg: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-500',
    lightBg: 'bg-green-50 dark:bg-green-950',
    textColor: 'text-green-700 dark:text-green-300',
  },
  personal: {
    gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
    iconBg: 'bg-orange-100 dark:bg-orange-900',
    iconColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-500',
    lightBg: 'bg-orange-50 dark:bg-orange-950',
    textColor: 'text-orange-700 dark:text-orange-300',
  },
  other: {
    gradient: 'bg-gradient-to-br from-gray-500 to-gray-700',
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-400',
    borderColor: 'border-gray-500',
    lightBg: 'bg-gray-50 dark:bg-gray-900',
    textColor: 'text-gray-700 dark:text-gray-300',
  },
};

/**
 * Get style configuration for a category
 * @param category The session category
 * @returns Style configuration object
 */
export function getCategoryStyle(category: SessionCategory): CategoryStyle {
  return categoryStyles[category] || categoryStyles.other;
}

/**
 * Get gradient class for a category
 * @param category The session category
 * @returns Tailwind gradient class string
 */
export function getCategoryGradient(category: SessionCategory): string {
  return getCategoryStyle(category).gradient;
}

/**
 * Get icon container classes for a category
 * @param category The session category
 * @returns Class string for icon container
 */
export function getCategoryIconClasses(category: SessionCategory): string {
  const style = getCategoryStyle(category);
  return `${style.iconBg} ${style.iconColor}`;
}

/**
 * Get border color class for a category
 * @param category The session category
 * @returns Tailwind border color class
 */
export function getCategoryBorderClass(category: SessionCategory): string {
  return getCategoryStyle(category).borderColor;
}
