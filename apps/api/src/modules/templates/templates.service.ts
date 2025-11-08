import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import type {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFilters,
  PaginationQuery,
  TemplateResponse,
} from '@repo/shared-types';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Transform Prisma template (UPPERCASE enums) to API response (lowercase enums)
   */
  private transformTemplate(template: any): TemplateResponse {
    return {
      ...template,
      category: template.category.toLowerCase(),
      priority: template.priority.toLowerCase(),
    };
  }

  /**
   * Transform multiple templates
   */
  private transformTemplates(templates: any[]): TemplateResponse[] {
    return templates.map((t) => this.transformTemplate(t));
  }

  async create(
    userId: string,
    dto: CreateTemplateDto,
  ): Promise<TemplateResponse> {
    // Validate required fields
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestException('Template name is required');
    }

    if (!dto.title || dto.title.trim().length === 0) {
      throw new BadRequestException('Title is required');
    }

    if (!dto.category) {
      throw new BadRequestException('Category is required');
    }

    if (!dto.duration || dto.duration <= 0) {
      throw new BadRequestException('Duration must be greater than 0');
    }

    try {
      const template = await this.prisma.sessionTemplate.create({
        data: {
          name: dto.name,
          title: dto.title,
          description: dto.description || null,
          category: dto.category.toUpperCase() as any,
          priority: dto.priority
            ? (dto.priority.toUpperCase() as any)
            : 'MEDIUM',
          duration: dto.duration,
          color: dto.color || null,
          tags: dto.tags || [],
          notes: dto.notes || null,
          userId,
        },
      });

      return this.transformTemplate(template);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException(
          'A template with this name already exists for this user',
        );
      }
      throw error;
    }
  }

  async findAll(
    userId: string,
    filters?: TemplateFilters,
    pagination?: PaginationQuery,
  ) {
    // Build where clause
    const where: any = {
      userId,
    };

    if (filters?.category) {
      where.category = filters.category.toUpperCase() as any;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    // Apply pagination
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    // Execute query
    const [templates, total] = await Promise.all([
      this.prisma.sessionTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: pagination?.sortBy
          ? { [pagination.sortBy]: pagination.sortOrder || 'desc' }
          : { createdAt: 'desc' },
      }),
      this.prisma.sessionTemplate.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: this.transformTemplates(templates),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string, userId: string): Promise<TemplateResponse> {
    const template = await this.prisma.sessionTemplate.findUnique({
      where: { id },
    });

    if (!template || template.userId !== userId) {
      throw new NotFoundException('Template not found');
    }

    return this.transformTemplate(template);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTemplateDto,
  ): Promise<TemplateResponse> {
    // Verify ownership
    await this.findById(id, userId);

    const template = await this.prisma.sessionTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        title: dto.title,
        description: dto.description !== undefined ? dto.description : undefined,
        category: dto.category
          ? (dto.category.toUpperCase() as any)
          : undefined,
        priority: dto.priority
          ? (dto.priority.toUpperCase() as any)
          : undefined,
        duration: dto.duration,
        color: dto.color !== undefined ? dto.color : undefined,
        tags: dto.tags,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
    });

    return this.transformTemplate(template);
  }

  async delete(id: string, userId: string): Promise<void> {
    // Verify ownership
    await this.findById(id, userId);

    await this.prisma.sessionTemplate.delete({
      where: { id },
    });
  }

  async search(userId: string, query: string): Promise<TemplateResponse[]> {
    const templates = await this.prisma.sessionTemplate.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return this.transformTemplates(templates);
  }
}
