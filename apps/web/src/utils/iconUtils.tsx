import {
  BookOpen,
  Code2,
  Languages,
  User,
  FileText,
  Target,
  BarChart3,
  Clock,
  Trophy,
  BookMarked,
  RotateCw,
  Plus,
  Calendar,
  Library,
  CheckCircle2,
  Zap,
  Timer,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import type { SessionCategory } from '@repo/shared-types';

// Category icon mapping
export const categoryIcons: Record<SessionCategory, LucideIcon> = {
  school: GraduationCap,
  programming: Code2,
  language: Languages,
  personal: User,
  other: FileText,
};

// Get category icon component
export function getCategoryIconComponent(category: SessionCategory): LucideIcon {
  return categoryIcons[category] || FileText;
}

// Feature icons for landing page
export const featureIcons = {
  goal: Target,
  analytics: BarChart3,
  time: Clock,
  achievement: Trophy,
  notes: BookMarked,
  progress: RotateCw,
};

// Quick action icons
export const actionIcons = {
  newSession: Plus,
  calendar: Calendar,
  sessions: Library,
};

// Stats icons
export const statsIcons = {
  total: BookOpen,
  completed: CheckCircle2,
  inProgress: Zap,
  time: Timer,
};
