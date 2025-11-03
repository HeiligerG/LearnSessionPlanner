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
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import type {
  CreateSessionDto,
  UpdateSessionDto,
  SessionFilters,
  ApiResponse,
  PaginationQuery,
  CalendarSessionDto,
} from '@repo/shared-types';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSessionDto): Promise<ApiResponse<any>> {
    // TODO: Get userId from authenticated user
    const userId = 'test-user-id'; // Temporary hardcoded value

    const session = await this.sessionsService.create(userId, dto);

    return {
      success: true,
      message: 'Session created successfully',
      data: session,
    };
  }

  @Get()
  async findAll(
    @Query() filters: SessionFilters,
    @Query() pagination: PaginationQuery,
  ): Promise<ApiResponse<any>> {
    // TODO: Get userId from authenticated user
    const userId = 'test-user-id';

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
    @Query() dto: CalendarSessionDto,
  ): Promise<ApiResponse<any>> {
    // TODO: Get userId from authenticated user
    const userId = 'test-user-id';

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

  @Get('stats')
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<any>> {
    // TODO: Get userId from authenticated user
    const userId = 'test-user-id';

    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

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

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<any>> {
    // TODO: Get userId from authenticated user
    const userId = 'test-user-id';

    const session = await this.sessionsService.findById(id, userId);

    return {
      success: true,
      message: 'Session retrieved successfully',
      data: session,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionDto,
  ): Promise<ApiResponse<any>> {
    // TODO: Get userId from authenticated user
    const userId = 'test-user-id';

    const session = await this.sessionsService.update(id, userId, dto);

    return {
      success: true,
      message: 'Session updated successfully',
      data: session,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    // TODO: Get userId from authenticated user
    const userId = 'test-user-id';

    await this.sessionsService.delete(id, userId);
  }

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
