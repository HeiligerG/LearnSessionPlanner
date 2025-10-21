import type { Session } from './session.entity';

/**
 * Progress entity type definition for tracking learning progress
 */
export interface Progress {
  id: string;
  sessionId: string;
  notes: string | null;
  rating: number | null;
  completionPercentage: number;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Progress entity with session relation populated
 */
export interface ProgressWithSession extends Progress {
  session: Session;
}
