/**
 * Session category enum for categorizing learning sessions
 */
export enum SessionCategory {
  SCHOOL = 'school',
  PROGRAMMING = 'programming',
  LANGUAGE = 'language',
  PERSONAL = 'personal',
  OTHER = 'other',
}

/**
 * Array of all session category values for runtime validation and UI dropdowns
 */
export const SESSION_CATEGORIES = Object.values(SessionCategory);
