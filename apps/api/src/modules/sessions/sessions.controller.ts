import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type {
  CreateSessionDto,
  UpdateSessionDto,
  SessionFilters,
  ApiResponse,
  PaginationQuery,
  CalendarSessionDto,
  DetailedStatsDto,
  CategoryStatsDto,
  TrendDataPoint,
  BulkCreateSessionDto,
  BulkCreateResult,
} from '@repo/shared-types';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSessionDto,
  ): Promise<ApiResponse<any>> {
    const session = await this.sessionsService.create(userId, dto);

    return {
      success: true,
      message: 'Session created successfully',
      data: session,
    };
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreate(
    @CurrentUser('sub') userId: string,
    @Body() dto: BulkCreateSessionDto,
  ): Promise<ApiResponse<BulkCreateResult>> {
    // Validate input
    if (!dto.sessions || dto.sessions.length === 0) {
      throw new BadRequestException('At least one session is required');
    }

    if (dto.sessions.length > 500) {
      throw new BadRequestException('Cannot create more than 500 sessions at once');
    }

    const result = await this.sessionsService.bulkCreate(userId, dto);

    return {
      success: true,
      message: `Bulk create completed: ${result.totalCreated} created, ${result.totalFailed} failed`,
      data: result,
    };
  }

  @Get()
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query() filters: SessionFilters,
    @Query() pagination: PaginationQuery,
  ): Promise<ApiResponse<any>> {
    const result = await this.sessionsService.findAll(
      userId,
      filters,
      pagination,
    );

    return {
      success: true,
      message: 'Sessions retrieved successfully',
      data: result,
    };
  }

  @Get('calendar')
  async getCalendarSessions(
    @CurrentUser('sub') userId: string,
    @Query() dto: CalendarSessionDto,
  ): Promise<ApiResponse<any>> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const filters: Partial<SessionFilters> = {};
    if (dto.categories) {
      // Filter will be applied in service
    }
    if (dto.statuses) {
      filters.status = dto.statuses;
    }

    const sessions = await this.sessionsService.findByDateRange(
      userId,
      startDate,
      endDate,
      filters,
    );

    return {
      success: true,
      message: 'Calendar sessions retrieved successfully',
      data: sessions,
    };
  }

  @Get('stats/detailed')
  async getDetailedStats(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<DetailedStatsDto>> {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    // Validate parsed dates
    if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
      throw new BadRequestException('Invalid startDate');
    }
    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }

    const stats = await this.sessionsService.getDetailedStats(
      userId,
      parsedStartDate,
      parsedEndDate,
    );

    return {
      success: true,
      message: 'Detailed statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('stats/category')
  async getCategoryStats(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<CategoryStatsDto[]>> {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    // Validate parsed dates
    if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
      throw new BadRequestException('Invalid startDate');
    }
    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }

    const stats = await this.sessionsService.getCategoryStats(
      userId,
      parsedStartDate,
      parsedEndDate,
    );

    return {
      success: true,
      message: 'Category statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('stats/trends')
  async getTrendData(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<TrendDataPoint[]>> {
    if (!startDate || !endDate) {
      throw new BadRequestException('Both startDate and endDate are required');
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Validate parsed dates
    if (isNaN(parsedStartDate.getTime())) {
      throw new BadRequestException('Invalid startDate');
    }
    if (isNaN(parsedEndDate.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }

    const trends = await this.sessionsService.getTrendData(
      userId,
      parsedStartDate,
      parsedEndDate,
    );

    return {
      success: true,
      message: 'Trend data retrieved successfully',
      data: trends,
    };
  }

  @Get('stats')
  async getStats(
    @CurrentUser('sub') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<any>> {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    // Validate parsed dates
    if (parsedStartDate && isNaN(parsedStartDate.getTime())) {
      throw new BadRequestException('Invalid startDate');
    }
    if (parsedEndDate && isNaN(parsedEndDate.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }

    const stats = await this.sessionsService.getStats(
      userId,
      parsedStartDate,
      parsedEndDate,
    );

    return {
      success: true,
      message: 'Session statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('search')
  async search(
    @CurrentUser('sub') userId: string,
    @Query('q') query: string,
  ): Promise<ApiResponse<any[]>> {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        message: 'Search query is empty',
        data: [],
      };
    }

    const sessions = await this.sessionsService.search(userId, query.trim());

    return {
      success: true,
      message: 'Search completed successfully',
      data: sessions,
    };
  }

  @Get(':id')
  async findOne(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<any>> {
    const session = await this.sessionsService.findById(id, userId);

    return {
      success: true,
      message: 'Session retrieved successfully',
      data: session,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionDto,
  ): Promise<ApiResponse<any>> {
    const session = await this.sessionsService.update(id, userId, dto);

    return {
      success: true,
      message: 'Session updated successfully',
      data: session,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.sessionsService.delete(id, userId);
  }

  @Public()
  @Post('auto-update-missed')
  @HttpCode(HttpStatus.OK)
  async autoUpdateMissed(): Promise<ApiResponse<any>> {
    const count = await this.sessionsService.autoUpdateMissedSessions();

    return {
      success: true,
      message: `Updated ${count} sessions to MISSED status`,
      data: { count },
    };
  }
}
