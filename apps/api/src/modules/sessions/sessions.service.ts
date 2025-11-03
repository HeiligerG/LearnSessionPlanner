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
    const where: Prisma.SessionWhereInput = {
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
    const where: Prisma.SessionWhereInput = { userId };

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
}
