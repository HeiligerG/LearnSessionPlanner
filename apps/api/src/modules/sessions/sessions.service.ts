import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import type {
  CreateSessionDto,
  UpdateSessionDto,
  SessionFilters,
  PaginationQuery,
  SessionStatsDto,
  CategoryStatsDto,
  TrendDataPoint,
  TimeDistributionDto,
  ProductivityMetricsDto,
  DetailedStatsDto,
  BulkCreateSessionDto,
  BulkCreateResult,
  BulkUpdateSessionDto,
  BulkOperationResult,
  ExportFormat,
  SessionSuggestionDto,
  GamificationSummaryDto,
  AchievementDto,
  RecurrencePattern,
  SessionResponse,
} from '@repo/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Transform Prisma session (UPPERCASE enums) to API response (lowercase enums)
   */
  private transformSession(session: any) {
    return {
      ...session,
      category: session.category.toLowerCase(),
      status: session.status.toLowerCase().replace('_', '_'), // Keep underscore format
      priority: session.priority.toLowerCase(),
    };
  }

  /**
   * Transform multiple sessions
   */
  private transformSessions(sessions: any[]) {
    return sessions.map((s) => this.transformSession(s));
  }

  async create(userId: string, dto: CreateSessionDto) {
    // Validate scheduledFor date if provided
    if (dto.scheduledFor) {
      const scheduledDate = new Date(dto.scheduledFor);
      if (isNaN(scheduledDate.getTime())) {
        throw new BadRequestException('Invalid scheduledFor date');
      }
    }

    // Create session with defaults
    const session = await this.prisma.session.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        category: dto.category.toUpperCase() as any,
        status: (dto.status || 'planned').toUpperCase() as any,
        priority: (dto.priority || 'medium').toUpperCase() as any,
        duration: dto.duration,
        color: dto.color || null,
        tags: dto.tags || [],
        notes: dto.notes || null,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        userId,
      },
    });

    return this.transformSession(session);
  }

  async findAll(
    userId: string,
    filters?: SessionFilters,
    pagination?: PaginationQuery,
  ) {
    // Build where clause
    const where: any = {
      userId,
    };

    if (filters?.category) {
      where.category = filters.category.toUpperCase() as any;
    }

    if (filters?.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status.map((s) => s.toUpperCase() as any) }
        : (filters.status.toUpperCase() as any);
    }

    if (filters?.priority) {
      where.priority = Array.isArray(filters.priority)
        ? { in: filters.priority.map((p) => p.toUpperCase() as any) }
        : (filters.priority.toUpperCase() as any);
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters?.scheduledFrom || filters?.scheduledTo) {
      where.scheduledFor = {};
      if (filters.scheduledFrom) {
        where.scheduledFor.gte = new Date(filters.scheduledFrom);
      }
      if (filters.scheduledTo) {
        where.scheduledFor.lte = new Date(filters.scheduledTo);
      }
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    // Execute query
    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: pagination?.sortBy
          ? { [pagination.sortBy]: pagination.sortOrder || 'desc' }
          : { createdAt: 'desc' },
      }),
      this.prisma.session.count({ where }),
    ]);

    return {
      data: this.transformSessions(sessions),
      metadata: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return this.transformSession(session);
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    filters?: Partial<SessionFilters>,
  ) {
    const where: Prisma.SessionWhereInput = {
      userId,
      scheduledFor: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filters?.category) {
      where.category = filters.category.toUpperCase() as any;
    }

    if (filters?.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status.map((s) => s.toUpperCase() as any) }
        : (filters.status.toUpperCase() as any);
    }

    const sessions = await this.prisma.session.findMany({
      where,
      orderBy: { scheduledFor: 'asc' },
    });

    return this.transformSessions(sessions);
  }

  async update(id: string, userId: string, dto: UpdateSessionDto) {
    // Find session
    const session = await this.findById(id, userId);

    // Validate status transitions
    if (dto.status) {
      const upperStatus = dto.status.toUpperCase();
      // Auto-set completedAt when status changes to COMPLETED
      if (upperStatus === 'COMPLETED' && !dto.completedAt) {
        dto.completedAt = new Date().toISOString();
      }
      // Auto-set startedAt when status changes to IN_PROGRESS
      if (upperStatus === 'IN_PROGRESS' && !session.startedAt && !dto.startedAt) {
        dto.startedAt = new Date().toISOString();
      }
    }

    // Update session
    const updated = await this.prisma.session.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category && { category: dto.category.toUpperCase() as any }),
        ...(dto.status && { status: dto.status.toUpperCase() as any }),
        ...(dto.priority && { priority: dto.priority.toUpperCase() as any }),
        ...(dto.duration && { duration: dto.duration }),
        ...(dto.actualDuration !== undefined && {
          actualDuration: dto.actualDuration,
        }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.scheduledFor !== undefined && {
          scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        }),
        ...(dto.startedAt !== undefined && {
          startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
        }),
        ...(dto.completedAt !== undefined && {
          completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
        }),
      },
    });

    return this.transformSession(updated);
  }

  async delete(id: string, userId: string) {
    // Find session
    await this.findById(id, userId);

    // Delete session
    await this.prisma.session.delete({
      where: { id },
    });
  }

  async getStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SessionStatsDto> {
    const where: any = { userId };

    if (startDate || endDate) {
      where.scheduledFor = {};
      if (startDate) where.scheduledFor.gte = startDate;
      if (endDate) where.scheduledFor.lte = endDate;
    }

    // Get counts by status
    const [total, completed, inProgress, missed, planned, totalDuration, completedDuration] =
      await Promise.all([
        this.prisma.session.count({ where }),
        this.prisma.session.count({
          where: { ...where, status: 'COMPLETED' },
        }),
        this.prisma.session.count({
          where: { ...where, status: 'IN_PROGRESS' },
        }),
        this.prisma.session.count({ where: { ...where, status: 'MISSED' } }),
        this.prisma.session.count({ where: { ...where, status: 'PLANNED' } }),
        this.prisma.session.aggregate({
          where,
          _sum: { duration: true },
        }),
        this.prisma.session.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { actualDuration: true, duration: true },
        }),
      ]);

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      missed,
      planned,
      totalDuration: totalDuration._sum.duration || 0,
      completedDuration:
        completedDuration._sum.actualDuration ||
        completedDuration._sum.duration ||
        0,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }

  async getCategoryStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CategoryStatsDto[]> {
    const where: any = { userId };

    if (startDate || endDate) {
      where.scheduledFor = {};
      if (startDate) where.scheduledFor.gte = startDate;
      if (endDate) where.scheduledFor.lte = endDate;
    }

    // Group all sessions by category
    const allSessionsGrouped = await this.prisma.session.groupBy({
      by: ['category'],
      where,
      _count: { _all: true },
      _sum: { duration: true },
    });

    // Group completed sessions by category
    const completedSessionsGrouped = await this.prisma.session.groupBy({
      by: ['category'],
      where: { ...where, status: 'COMPLETED' },
      _count: { _all: true },
      _sum: { duration: true, actualDuration: true },
    });

    // Create map for completed sessions by category
    const completedMap = new Map(
      completedSessionsGrouped.map((group) => [
        group.category,
        {
          count: group._count._all,
          duration: group._sum.actualDuration || group._sum.duration || 0,
        },
      ]),
    );

    // Build result
    const result: CategoryStatsDto[] = allSessionsGrouped.map((group) => {
      const completed = completedMap.get(group.category) || {
        count: 0,
        duration: 0,
      };
      const totalSessions = group._count._all;
      const completedSessions = completed.count;

      return {
        category: group.category.toLowerCase() as any,
        totalSessions,
        completedSessions,
        totalDuration: group._sum.duration || 0,
        completedDuration: completed.duration,
        completionRate:
          totalSessions > 0
            ? Math.round((completedSessions / totalSessions) * 10000) / 100
            : 0,
      };
    });

    return result;
  }

  async getTrendData(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TrendDataPoint[]> {
    // Helper to format date as YYYY-MM-DD in local time
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        scheduledFor: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, TrendDataPoint>();

    // Generate date range using local date
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = formatLocalDate(currentDate);
      dateMap.set(dateKey, {
        date: dateKey,
        planned: 0,
        completed: 0,
        inProgress: 0,
        missed: 0,
        cancelled: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count sessions by status per date using local date
    sessions.forEach((session: any) => {
      if (!session.scheduledFor) return;
      const dateKey = formatLocalDate(new Date(session.scheduledFor));
      const point = dateMap.get(dateKey);
      if (!point) return;

      switch (session.status) {
        case 'PLANNED':
          point.planned++;
          break;
        case 'COMPLETED':
          point.completed++;
          break;
        case 'IN_PROGRESS':
          point.inProgress++;
          break;
        case 'MISSED':
          point.missed++;
          break;
        case 'CANCELLED':
          point.cancelled++;
          break;
      }
    });

    return Array.from(dateMap.values());
  }

  async getTimeDistribution(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TimeDistributionDto> {
    const where: any = { userId };

    if (startDate || endDate) {
      where.scheduledFor = {};
      if (startDate) where.scheduledFor.gte = startDate;
      if (endDate) where.scheduledFor.lte = endDate;
    }

    const sessions = await this.prisma.session.findMany({ where });

    if (sessions.length === 0) {
      return {
        totalPlannedHours: 0,
        totalCompletedHours: 0,
        averageSessionDuration: 0,
        longestSession: 0,
        shortestSession: 0,
        byDayOfWeek: [
          { day: 'Sunday', hours: 0 },
          { day: 'Monday', hours: 0 },
          { day: 'Tuesday', hours: 0 },
          { day: 'Wednesday', hours: 0 },
          { day: 'Thursday', hours: 0 },
          { day: 'Friday', hours: 0 },
          { day: 'Saturday', hours: 0 },
        ],
      };
    }

    const totalPlannedMinutes = sessions.reduce(
      (sum: number, s: any) => sum + s.duration,
      0,
    );
    const completedSessions = sessions.filter((s: any) => s.status === 'COMPLETED');
    const totalCompletedMinutes = completedSessions.reduce(
      (sum: number, s: any) => sum + (s.actualDuration || s.duration),
      0,
    );

    const durations = sessions.map((s: any) => s.duration);
    const avgDuration =
      durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length;
    const longestSession = Math.max(...durations);
    const shortestSession = Math.min(...durations);

    // Group by day of week
    const dayMap = new Map<number, number>();
    sessions.forEach((session: any) => {
      if (session.scheduledFor) {
        const day = session.scheduledFor.getDay();
        dayMap.set(day, (dayMap.get(day) || 0) + session.duration / 60);
      }
    });

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const byDayOfWeek = dayNames.map((day, index) => ({
      day,
      hours: Math.round((dayMap.get(index) || 0) * 100) / 100,
    }));

    return {
      totalPlannedHours: Math.round((totalPlannedMinutes / 60) * 100) / 100,
      totalCompletedHours:
        Math.round((totalCompletedMinutes / 60) * 100) / 100,
      averageSessionDuration: Math.round(avgDuration * 100) / 100,
      longestSession,
      shortestSession,
      byDayOfWeek,
    };
  }

  async getProductivityMetrics(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ProductivityMetricsDto> {
    const where: any = { userId };

    if (startDate || endDate) {
      where.scheduledFor = {};
      if (startDate) where.scheduledFor.gte = startDate;
      if (endDate) where.scheduledFor.lte = endDate;
    }

    const sessions = await this.prisma.session.findMany({
      where,
      orderBy: { scheduledFor: 'asc' },
    });

    if (sessions.length === 0) {
      return {
        completionRate: 0,
        onTimeCompletionRate: 0,
        averageDelayDays: 0,
        mostProductiveCategory: 'programming' as any,
        mostProductiveTimeOfDay: 'morning',
        streakDays: 0,
      };
    }

    // Completion rate
    const completed = sessions.filter((s: any) => s.status === 'COMPLETED').length;
    const completionRate =
      Math.round((completed / sessions.length) * 10000) / 100;

    // On-time completion
    const onTimeCompleted = sessions.filter(
      (s: any) =>
        s.status === 'COMPLETED' &&
        s.scheduledFor &&
        s.completedAt &&
        new Date(s.scheduledFor).toDateString() ===
          new Date(s.completedAt).toDateString(),
    ).length;
    const onTimeCompletionRate =
      completed > 0 ? Math.round((onTimeCompleted / completed) * 10000) / 100 : 0;

    // Average delay
    const delaysInDays = sessions
      .filter(
        (s: any) => s.status === 'COMPLETED' && s.scheduledFor && s.completedAt,
      )
      .map((s: any) => {
        const scheduled = new Date(s.scheduledFor!).getTime();
        const completed = new Date(s.completedAt!).getTime();
        return (completed - scheduled) / (1000 * 60 * 60 * 24);
      });
    const averageDelayDays =
      delaysInDays.length > 0
        ? Math.round(
            (delaysInDays.reduce((sum: number, d: number) => sum + d, 0) / delaysInDays.length) *
              100,
          ) / 100
        : 0;

    // Most productive category
    const categoryMap = new Map<string, { total: number; completed: number }>();
    sessions.forEach((s: any) => {
      const cat = s.category.toLowerCase();
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { total: 0, completed: 0 });
      }
      const stats = categoryMap.get(cat)!;
      stats.total++;
      if (s.status === 'COMPLETED') stats.completed++;
    });

    let mostProductiveCategory: any = 'other';
    let highestRate = 0;
    categoryMap.forEach((stats, cat) => {
      const rate = stats.completed / stats.total;
      if (rate > highestRate) {
        highestRate = rate;
        mostProductiveCategory = cat;
      }
    });

    // Most productive time of day
    const timeMap = new Map<string, { total: number; completed: number }>();
    ['morning', 'afternoon', 'evening'].forEach((t) =>
      timeMap.set(t, { total: 0, completed: 0 }),
    );

    sessions.forEach((s: any) => {
      if (s.scheduledFor) {
        const hour = s.scheduledFor.getHours();
        let timeOfDay = 'morning';
        if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
        else if (hour >= 18) timeOfDay = 'evening';

        const stats = timeMap.get(timeOfDay)!;
        stats.total++;
        if (s.status === 'COMPLETED') stats.completed++;
      }
    });

    let mostProductiveTimeOfDay = 'morning';
    let highestTimeRate = 0;
    timeMap.forEach((stats, time) => {
      if (stats.total > 0) {
        const rate = stats.completed / stats.total;
        if (rate > highestTimeRate) {
          highestTimeRate = rate;
          mostProductiveTimeOfDay = time;
        }
      }
    });

    // Streak calculation
    const completedDates = sessions
      .filter((s: any) => s.status === 'COMPLETED' && s.completedAt)
      .map((s: any) => new Date(s.completedAt!).toDateString())
      .filter((date: string, index: number, self: string[]) => self.indexOf(date) === index)
      .sort();

    let streakDays = 0;
    if (completedDates.length > 0) {
      const today = new Date().toDateString();
      if (completedDates[completedDates.length - 1] === today) {
        streakDays = 1;
        for (let i = completedDates.length - 2; i >= 0; i--) {
          const current = new Date(completedDates[i]);
          const next = new Date(completedDates[i + 1]);
          const diffDays =
            (next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) {
            streakDays++;
          } else {
            break;
          }
        }
      }
    }

    return {
      completionRate,
      onTimeCompletionRate,
      averageDelayDays,
      mostProductiveCategory,
      mostProductiveTimeOfDay,
      streakDays,
    };
  }

  async getDetailedStats(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DetailedStatsDto> {
    const [overview, byCategory, trends, timeDistribution, productivity] =
      await Promise.all([
        this.getStats(userId, startDate, endDate),
        this.getCategoryStats(userId, startDate, endDate),
        startDate && endDate
          ? this.getTrendData(userId, startDate, endDate)
          : Promise.resolve([]),
        this.getTimeDistribution(userId, startDate, endDate),
        this.getProductivityMetrics(userId, startDate, endDate),
      ]);

    return {
      overview,
      byCategory,
      trends,
      timeDistribution,
      productivity,
    };
  }

  async autoUpdateMissedSessions() {
    const now = new Date();

    const result = await this.prisma.session.updateMany({
      where: {
        status: 'PLANNED',
        scheduledFor: {
          lt: now,
        },
      },
      data: {
        status: 'MISSED',
      },
    });

    return result.count;
  }

  /**
   * Bulk create sessions with optional recurrence pattern
   */
  async bulkCreate(
    userId: string,
    dto: BulkCreateSessionDto,
  ): Promise<BulkCreateResult> {
    // Expand recurrence pattern if provided
    let sessionsToCreate: CreateSessionDto[] = [];

    if (dto.recurrence && dto.sessions.length > 0) {
      // Apply recurrence to all sessions if applyRecurrenceToAll is true
      if (dto.applyRecurrenceToAll !== false) {
        for (const baseSession of dto.sessions) {
          const expandedSessions = this.expandRecurrencePattern(
            baseSession,
            dto.recurrence,
          );
          sessionsToCreate.push(...expandedSessions);
        }
      } else {
        // Only apply to first session
        const expandedSessions = this.expandRecurrencePattern(
          dto.sessions[0],
          dto.recurrence,
        );
        sessionsToCreate.push(...expandedSessions);
        sessionsToCreate.push(...dto.sessions.slice(1));
      }
    } else {
      sessionsToCreate = dto.sessions;
    }

    // Limit to 500 sessions
    if (sessionsToCreate.length > 500) {
      throw new BadRequestException(
        'Cannot create more than 500 sessions at once',
      );
    }

    const successful: SessionResponse[] = [];
    const failed: Array<{ session: CreateSessionDto; error: string }> = [];

    // Process sessions sequentially to avoid parallel queries in transaction
    // This allows partial success - some sessions can fail while others succeed
    for (const session of sessionsToCreate) {
      try {
        // Validate session
        const validation = this.validateBulkSession(session);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Create session
        const created = await this.prisma.session.create({
          data: {
            title: session.title,
            description: session.description || null,
            category: session.category.toUpperCase() as any,
            status: session.status
              ? (session.status.toUpperCase() as any)
              : 'PLANNED',
            priority: session.priority
              ? (session.priority.toUpperCase() as any)
              : 'MEDIUM',
            duration: session.duration,
            color: session.color || null,
            tags: session.tags || [],
            notes: session.notes || null,
            scheduledFor: session.scheduledFor
              ? new Date(session.scheduledFor)
              : null,
            userId,
          },
        });

        successful.push(this.transformSession(created) as SessionResponse);
      } catch (error) {
        failed.push({
          session,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      totalCreated: successful.length,
      totalFailed: failed.length,
    };
  }

  /**
   * Expand recurrence pattern into individual sessions
   */
  private expandRecurrencePattern(
    baseSession: CreateSessionDto,
    recurrence: RecurrencePattern,
  ): CreateSessionDto[] {
    const sessions: CreateSessionDto[] = [];
    const startDate = baseSession.scheduledFor
      ? new Date(baseSession.scheduledFor)
      : new Date();

    let count = 0;
    const maxOccurrences = 365; // Safety limit

    if (recurrence.frequency === 'weekly' && recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
      // Special handling for weekly recurrence with specific days
      // Compute the start of the week containing startDate
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      let weekIndex = 0;
      while (count < maxOccurrences) {
        // Compute start of current week
        const currentWeekStart = new Date(weekStart);
        currentWeekStart.setDate(currentWeekStart.getDate() + weekIndex * recurrence.interval * 7);

        // Iterate through selected days of week
        for (const dayOfWeek of recurrence.daysOfWeek.sort()) {
          const occurrenceDate = new Date(currentWeekStart);
          occurrenceDate.setDate(occurrenceDate.getDate() + dayOfWeek);

          // Skip if before start date
          if (occurrenceDate < startDate) continue;

          // Check end conditions
          if (recurrence.endType === 'date' && recurrence.endDate) {
            const endDate = new Date(recurrence.endDate);
            if (occurrenceDate > endDate) return sessions;
          }

          if (recurrence.endType === 'count' && recurrence.endCount) {
            if (count >= recurrence.endCount) return sessions;
          }

          // Add session
          sessions.push({
            ...baseSession,
            scheduledFor: occurrenceDate.toISOString(),
          });
          count++;

          if (count >= maxOccurrences) return sessions;
        }

        weekIndex++;
      }
    } else {
      // For daily and monthly recurrence
      let currentDate = new Date(startDate);

      while (count < maxOccurrences) {
        // Check end conditions
        if (recurrence.endType === 'date' && recurrence.endDate) {
          const endDate = new Date(recurrence.endDate);
          if (currentDate > endDate) break;
        }

        if (recurrence.endType === 'count' && recurrence.endCount) {
          if (count >= recurrence.endCount) break;
        }

        // Add session
        sessions.push({
          ...baseSession,
          scheduledFor: currentDate.toISOString(),
        });
        count++;

        // Increment date based on frequency
        if (recurrence.frequency === 'daily') {
          currentDate.setDate(currentDate.getDate() + recurrence.interval);
        } else if (recurrence.frequency === 'weekly') {
          // Weekly without specific days - just add interval weeks
          currentDate.setDate(currentDate.getDate() + recurrence.interval * 7);
        } else if (recurrence.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
          if (recurrence.dayOfMonth) {
            currentDate.setDate(recurrence.dayOfMonth);
          }
        }
      }
    }

    return sessions;
  }

  /**
   * Validate a bulk session
   */
  private validateBulkSession(session: CreateSessionDto): {
    valid: boolean;
    error?: string;
  } {
    if (!session.title || session.title.trim().length === 0) {
      return { valid: false, error: 'Title is required' };
    }

    if (!session.category) {
      return { valid: false, error: 'Category is required' };
    }

    if (!session.duration || session.duration <= 0) {
      return { valid: false, error: 'Duration must be greater than 0' };
    }

    if (session.scheduledFor) {
      const date = new Date(session.scheduledFor);
      if (isNaN(date.getTime())) {
        return { valid: false, error: 'Invalid scheduledFor date' };
      }
    }

    return { valid: true };
  }

  /**
   * Search sessions by query string (title, description, tags)
   */
  async search(userId: string, query: string): Promise<SessionResponse[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      orderBy: { scheduledFor: 'desc' },
      take: 50, // Limit search results
    });

    return this.transformSessions(sessions);
  }

  /**
   * Bulk update sessions
   */
  async bulkUpdate(
    userId: string,
    dto: BulkUpdateSessionDto,
  ): Promise<BulkOperationResult> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const sessionId of dto.sessionIds) {
      try {
        // Verify ownership
        const session = await this.prisma.session.findFirst({
          where: { id: sessionId, userId },
        });

        if (!session) {
          failed.push({ id: sessionId, error: 'Session not found or access denied' });
          continue;
        }

        // Prepare update data
        const updateData: any = {};
        if (dto.updates.title !== undefined) updateData.title = dto.updates.title;
        if (dto.updates.description !== undefined) updateData.description = dto.updates.description;
        if (dto.updates.category !== undefined) updateData.category = dto.updates.category.toUpperCase();
        if (dto.updates.status !== undefined) updateData.status = dto.updates.status.toUpperCase();
        if (dto.updates.priority !== undefined) updateData.priority = dto.updates.priority.toUpperCase();
        if (dto.updates.duration !== undefined) updateData.duration = dto.updates.duration;
        if (dto.updates.actualDuration !== undefined) updateData.actualDuration = dto.updates.actualDuration;
        if (dto.updates.color !== undefined) updateData.color = dto.updates.color;
        if (dto.updates.tags !== undefined) updateData.tags = dto.updates.tags;
        if (dto.updates.notes !== undefined) updateData.notes = dto.updates.notes;
        if (dto.updates.scheduledFor !== undefined) {
          updateData.scheduledFor = dto.updates.scheduledFor ? new Date(dto.updates.scheduledFor) : null;
        }
        if (dto.updates.startedAt !== undefined) {
          updateData.startedAt = dto.updates.startedAt ? new Date(dto.updates.startedAt) : null;
        }
        if (dto.updates.completedAt !== undefined) {
          updateData.completedAt = dto.updates.completedAt ? new Date(dto.updates.completedAt) : null;
        }

        await this.prisma.session.update({
          where: { id: sessionId },
          data: updateData,
        });

        successful.push(sessionId);
      } catch (error) {
        failed.push({
          id: sessionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      totalProcessed: dto.sessionIds.length,
    };
  }

  /**
   * Bulk delete sessions
   */
  async bulkDelete(
    userId: string,
    sessionIds: string[],
  ): Promise<BulkOperationResult> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const sessionId of sessionIds) {
      try {
        // Verify ownership and delete
        const result = await this.prisma.session.deleteMany({
          where: { id: sessionId, userId },
        });

        if (result.count === 0) {
          failed.push({ id: sessionId, error: 'Session not found or access denied' });
        } else {
          successful.push(sessionId);
        }
      } catch (error) {
        failed.push({
          id: sessionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      successful,
      failed,
      totalProcessed: sessionIds.length,
    };
  }

  /**
   * Export sessions to CSV or JSON
   */
  async exportSessions(
    userId: string,
    format: ExportFormat,
    filters?: SessionFilters,
  ): Promise<string> {
    // Fetch sessions with filters
    const result = await this.findAll(userId, filters);
    const sessions = result.data;

    if (format === 'csv') {
      // CSV format
      const headers = [
        'ID',
        'Title',
        'Description',
        'Category',
        'Status',
        'Priority',
        'Duration',
        'Actual Duration',
        'Scheduled For',
        'Started At',
        'Completed At',
        'Tags',
        'Notes',
        'Created At',
      ];

      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      let csv = headers.join(',') + '\n';

      for (const session of sessions) {
        const row = [
          escapeCSV(session.id),
          escapeCSV(session.title),
          escapeCSV(session.description),
          escapeCSV(session.category),
          escapeCSV(session.status),
          escapeCSV(session.priority),
          escapeCSV(session.duration),
          escapeCSV(session.actualDuration),
          escapeCSV(session.scheduledFor),
          escapeCSV(session.startedAt),
          escapeCSV(session.completedAt),
          escapeCSV(session.tags.join(',')),
          escapeCSV(session.notes),
          escapeCSV(session.createdAt),
        ];
        csv += row.join(',') + '\n';
      }

      return csv;
    } else {
      // JSON format
      return JSON.stringify(sessions, null, 2);
    }
  }

  /**
   * Generate session suggestions based on user patterns
   */
  async generateSuggestions(userId: string): Promise<SessionSuggestionDto[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (sessions.length === 0) {
      return [];
    }

    const suggestions: SessionSuggestionDto[] = [];

    // Analyze patterns
    const categoryFrequency = new Map<string, number>();
    const categoryDurations = new Map<string, number[]>();
    const tagFrequency = new Map<string, number>();

    sessions.forEach((session) => {
      // Category frequency
      const cat = session.category.toLowerCase();
      categoryFrequency.set(cat, (categoryFrequency.get(cat) || 0) + 1);

      // Category average duration
      if (!categoryDurations.has(cat)) {
        categoryDurations.set(cat, []);
      }
      categoryDurations.get(cat)!.push(session.duration);

      // Tag frequency
      session.tags.forEach((tag) => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    // Get most common categories
    const sortedCategories = Array.from(categoryFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Generate suggestions based on most common categories
    for (const [category, count] of sortedCategories) {
      const durations = categoryDurations.get(category) || [];
      const avgDuration = Math.round(
        durations.reduce((sum, d) => sum + d, 0) / durations.length,
      );

      // Find common tags for this category
      const categoryTags = sessions
        .filter((s) => s.category.toLowerCase() === category)
        .flatMap((s) => s.tags);
      const uniqueTags = Array.from(new Set(categoryTags)).slice(0, 3);

      suggestions.push({
        suggestedTitle: `${category.charAt(0).toUpperCase() + category.slice(1)} Session`,
        suggestedCategory: category as any,
        suggestedDuration: avgDuration,
        suggestedTags: uniqueTags,
        reason: `You often study ${category} for ${avgDuration} minutes (${count} sessions)`,
        confidence: Math.min(count / sessions.length, 0.9),
      });
    }

    // Check for categories not studied recently (within 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const allCategories = new Set(sessions.map((s) => s.category.toLowerCase()));
    const recentCategories = new Set(
      sessions
        .filter((s) => new Date(s.createdAt) > twoWeeksAgo)
        .map((s) => s.category.toLowerCase()),
    );

    for (const category of allCategories) {
      if (!recentCategories.has(category) && suggestions.length < 5) {
        const durations = categoryDurations.get(category) || [];
        const avgDuration = Math.round(
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
        );

        suggestions.push({
          suggestedTitle: `Review ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          suggestedCategory: category as any,
          suggestedDuration: avgDuration,
          suggestedTags: [],
          reason: `You haven't practiced ${category} in over 2 weeks`,
          confidence: 0.7,
        });
      }
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Get gamification summary (achievements, streaks, level)
   */
  async getGamificationSummary(userId: string): Promise<GamificationSummaryDto> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
    const totalCompleted = completedSessions.length;

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedDates = completedSessions
      .filter((s) => s.completedAt)
      .map((s) => {
        const date = new Date(s.completedAt!);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
      .sort((a, b) => b - a);

    const uniqueDates = Array.from(new Set(completedDates));

    if (uniqueDates.length > 0) {
      const todayTime = today.getTime();
      const yesterdayTime = todayTime - 24 * 60 * 60 * 1000;

      if (uniqueDates[0] === todayTime || uniqueDates[0] === yesterdayTime) {
        currentStreak = 1;
        let lastDate = uniqueDates[0];

        for (let i = 1; i < uniqueDates.length; i++) {
          const dayDiff = (lastDate - uniqueDates[i]) / (24 * 60 * 60 * 1000);
          if (dayDiff === 1) {
            currentStreak++;
            lastDate = uniqueDates[i];
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      tempStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const dayDiff = (uniqueDates[i - 1] - uniqueDates[i]) / (24 * 60 * 60 * 1000);
        if (dayDiff === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    }

    // Define achievements
    const achievements: AchievementDto[] = [
      {
        id: 'first-session',
        name: 'Getting Started',
        description: 'Complete your first session',
        icon: 'Star',
        unlockedAt: totalCompleted >= 1 ? completedSessions[0].completedAt!.toISOString() : null,
        progress: Math.min(totalCompleted / 1, 1) * 100,
        category: 'Getting Started',
      },
      {
        id: 'ten-sessions',
        name: 'Dedicated Learner',
        description: 'Complete 10 sessions',
        icon: 'Target',
        unlockedAt: totalCompleted >= 10 ? completedSessions[9].completedAt!.toISOString() : null,
        progress: Math.min(totalCompleted / 10, 1) * 100,
        category: 'Milestones',
      },
      {
        id: 'fifty-sessions',
        name: 'Committed Student',
        description: 'Complete 50 sessions',
        icon: 'Award',
        unlockedAt: totalCompleted >= 50 ? completedSessions[49].completedAt!.toISOString() : null,
        progress: Math.min(totalCompleted / 50, 1) * 100,
        category: 'Milestones',
      },
      {
        id: 'hundred-sessions',
        name: 'Master Learner',
        description: 'Complete 100 sessions',
        icon: 'Trophy',
        unlockedAt: totalCompleted >= 100 ? completedSessions[99].completedAt!.toISOString() : null,
        progress: Math.min(totalCompleted / 100, 1) * 100,
        category: 'Milestones',
      },
      {
        id: 'seven-day-streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: 'Flame',
        unlockedAt: longestStreak >= 7 ? new Date().toISOString() : null,
        progress: Math.min(longestStreak / 7, 1) * 100,
        category: 'Consistency',
      },
      {
        id: 'thirty-day-streak',
        name: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: 'Zap',
        unlockedAt: longestStreak >= 30 ? new Date().toISOString() : null,
        progress: Math.min(longestStreak / 30, 1) * 100,
        category: 'Consistency',
      },
    ];

    // Calculate level and XP
    const level = Math.floor(totalCompleted / 10) + 1;
    const experiencePoints = totalCompleted * 10;
    const nextLevelThreshold = level * 10 * 10;

    return {
      currentStreak,
      longestStreak,
      totalSessionsCompleted: totalCompleted,
      achievements,
      level,
      experiencePoints,
      nextLevelThreshold,
    };
  }

}
