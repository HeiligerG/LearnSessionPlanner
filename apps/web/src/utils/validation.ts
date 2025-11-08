export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validation = {
  /**
   * Validates session title
   * - Required
   * - Min length: 3 characters
   * - Max length: 200 characters
   */
  title: (value: string): ValidationResult => {
    if (!value || value.trim().length === 0) {
      return { isValid: false, error: 'Title is required' };
    }
    if (value.trim().length < 3) {
      return { isValid: false, error: 'Title must be at least 3 characters long' };
    }
    if (value.length > 200) {
      return { isValid: false, error: 'Title must not exceed 200 characters' };
    }
    return { isValid: true };
  },

  /**
   * Validates description
   * - Optional
   * - Max length: 1000 characters
   */
  description: (value: string): ValidationResult => {
    if (value && value.length > 1000) {
      return { isValid: false, error: 'Description must not exceed 1000 characters' };
    }
    return { isValid: true };
  },

  /**
   * Validates duration
   * - Required
   * - Must be a positive number
   * - Min: 5 minutes
   * - Max: 480 minutes (8 hours)
   */
  duration: (value: number): ValidationResult => {
    if (!value || isNaN(value)) {
      return { isValid: false, error: 'Duration is required' };
    }
    if (value < 5) {
      return { isValid: false, error: 'Duration must be at least 5 minutes' };
    }
    if (value > 480) {
      return { isValid: false, error: 'Duration must not exceed 480 minutes (8 hours)' };
    }
    return { isValid: true };
  },

  /**
   * Validates scheduled date
   * - Optional
   * - Cannot be more than 2 years in the future
   */
  scheduledFor: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: true }; // Optional field
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }

    const twoYearsFromNow = new Date();
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

    if (date > twoYearsFromNow) {
      return { isValid: false, error: 'Scheduled date cannot be more than 2 years in the future' };
    }

    return { isValid: true };
  },

  /**
   * Validates tags
   * - Optional
   * - Max 10 tags
   * - Each tag max 50 characters
   * - No duplicate tags
   */
  tags: (value: string[]): ValidationResult => {
    if (!value || value.length === 0) {
      return { isValid: true }; // Optional field
    }

    if (value.length > 10) {
      return { isValid: false, error: 'Maximum 10 tags allowed' };
    }

    const longTag = value.find(tag => tag.length > 50);
    if (longTag) {
      return { isValid: false, error: 'Each tag must not exceed 50 characters' };
    }

    const uniqueTags = new Set(value.map(tag => tag.toLowerCase()));
    if (uniqueTags.size !== value.length) {
      return { isValid: false, error: 'Duplicate tags are not allowed' };
    }

    return { isValid: true };
  },

  /**
   * Validates notes
   * - Optional
   * - Max length: 2000 characters
   */
  notes: (value: string): ValidationResult => {
    if (value && value.length > 2000) {
      return { isValid: false, error: 'Notes must not exceed 2000 characters' };
    }
    return { isValid: true };
  },

  /**
   * Validates template name
   * - Required
   * - Min length: 3 characters
   * - Max length: 100 characters
   */
  templateName: (value: string): ValidationResult => {
    if (!value || value.trim().length === 0) {
      return { isValid: false, error: 'Template name is required' };
    }
    if (value.trim().length < 3) {
      return { isValid: false, error: 'Template name must be at least 3 characters long' };
    }
    if (value.length > 100) {
      return { isValid: false, error: 'Template name must not exceed 100 characters' };
    }
    return { isValid: true };
  },
};

/**
 * Validates all session form fields at once
 */
export function validateSessionForm(data: {
  title: string;
  description?: string;
  duration: number;
  scheduledFor?: string;
  tags?: string[];
  notes?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const titleResult = validation.title(data.title);
  if (!titleResult.isValid && titleResult.error) {
    errors.title = titleResult.error;
  }

  if (data.description) {
    const descResult = validation.description(data.description);
    if (!descResult.isValid && descResult.error) {
      errors.description = descResult.error;
    }
  }

  const durationResult = validation.duration(data.duration);
  if (!durationResult.isValid && durationResult.error) {
    errors.duration = durationResult.error;
  }

  if (data.scheduledFor) {
    const schedResult = validation.scheduledFor(data.scheduledFor);
    if (!schedResult.isValid && schedResult.error) {
      errors.scheduledFor = schedResult.error;
    }
  }

  if (data.tags) {
    const tagsResult = validation.tags(data.tags);
    if (!tagsResult.isValid && tagsResult.error) {
      errors.tags = tagsResult.error;
    }
  }

  if (data.notes) {
    const notesResult = validation.notes(data.notes);
    if (!notesResult.isValid && notesResult.error) {
      errors.notes = notesResult.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
