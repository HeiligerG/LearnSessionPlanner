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
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import type { Express } from 'express';
import { SessionsService } from './sessions.service';
import { FileParserService } from './file-parser.service';
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
  FileImportResultDto,
} from '@repo/shared-types';
import { SessionCategory } from '@repo/shared-types';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly fileParserService: FileParserService,
  ) {}

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

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (_, file, cb) => {
      const allowedMimes = ['text/csv', 'application/json', 'text/xml', 'application/xml'];
      const allowedExtensions = /\.(csv|json|xml)$/;
      
      if (allowedMimes.includes(file.mimetype) || file.originalname.match(allowedExtensions)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only CSV, JSON, and XML files are allowed'), false);
      }
    }
  }))
  async importSessions(
    @CurrentUser('sub') _userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ApiResponse<FileImportResultDto>> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Read file content - ensure buffer exists
    if (!file.buffer) {
      throw new BadRequestException('File buffer is not available');
    }
    const content = file.buffer.toString('utf-8');
    if (!content.trim()) {
      throw new BadRequestException('File is empty');
    }

    let parsedRows: any[] = [];

    // Determine file type using both extension and mimetype (Comment 4)
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const mime = file.mimetype;
    
    // Prefer extension when mimetype is not recognized
    const recognizedMimes = ['text/csv', 'application/json', 'text/xml', 'application/xml'];
    let fileType = '';
    
    if (recognizedMimes.includes(mime)) {
      fileType = mime;
    } else {
      // Fall back to extension-based detection
      switch (ext) {
        case 'csv':
          fileType = 'csv';
          break;
        case 'json':
          fileType = 'json';
          break;
        case 'xml':
          fileType = 'xml';
          break;
        default:
          throw new BadRequestException('Unsupported file format');
      }
    }
    
    try {
      if (fileType === 'text/csv' || fileType === 'csv') {
        parsedRows = this.fileParserService.parseCSV(content);
      } else if (fileType === 'application/json' || fileType === 'json') {
        parsedRows = this.fileParserService.parseJSON(content);
      } else if (fileType === 'text/xml' || fileType === 'application/xml' || fileType === 'xml') {
        parsedRows = await this.fileParserService.parseXML(content);
      } else {
        throw new BadRequestException('Unsupported file format');
      }
    } catch (error: any) {
      throw new BadRequestException(`File parsing failed: ${error.message}`);
    }

    // Build response with detailed results (Comment 3 - preview-first workflow)
    const successfulRows = parsedRows.filter(row => row.status === 'success');
    const failedRows = parsedRows.filter(row => row.status === 'error');
    const warningRows = parsedRows.filter(row => row.status === 'warning');
    const duplicateRows = parsedRows.filter(row => row.isDuplicate);

    const result: FileImportResultDto = {
      summary: {
        totalRows: parsedRows.length,
        successfulRows: successfulRows.length,
        failedRows: failedRows.length,
        duplicateRows: duplicateRows.length,
        warningRows: warningRows.length,
      },
      rows: parsedRows,
      errors: failedRows.flatMap(row => row.errors),
    };

    const successMessage = `File parsing completed: ${successfulRows.length} parsed successfully, ${failedRows.length} failed to parse, ${warningRows.length} with warnings, ${duplicateRows.length} duplicates found`;

    return {
      success: true,
      message: successMessage,
      data: result,
    };
  }

  @Public()
  @Get('sample/:format')
  async downloadSample(
    @Param('format') format: string,
    @Res() res: Response,
  ): Promise<void> {
    const validFormats = ['csv', 'json', 'xml'];
    if (!validFormats.includes(format)) {
      throw new BadRequestException(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }

    // Sample data with valid SessionCategory enum values (Comment 5)
    const sampleSessions = [
      {
        title: 'Learn React Fundamentals',
        description: 'Study React components, state, and props',
        category: SessionCategory.PROGRAMMING,
        status: 'planned',
        priority: 'high',
        duration: 120,
        color: '#61dafb',
        tags: ['react', 'javascript', 'frontend'],
        notes: 'Focus on hooks and functional components',
        scheduledFor: '2025-01-15T10:00:00Z',
      },
      {
        title: 'French Language Practice',
        description: 'Practice French vocabulary and grammar',
        category: SessionCategory.LANGUAGE,
        status: 'planned',
        priority: 'medium',
        duration: 90,
        color: '#ff6b6b',
        tags: ['french', 'language', 'vocabulary'],
        notes: 'Use language learning app',
        scheduledFor: '2025-01-16T14:00:00Z',
      },
      {
        title: 'Personal Development Reading',
        description: 'Read personal development book',
        category: SessionCategory.PERSONAL,
        status: 'planned',
        priority: 'low',
        duration: 60,
        color: '#4ecdc4',
        tags: ['reading', 'personal-growth'],
        notes: 'Take notes on key insights',
        scheduledFor: '2025-01-17T16:00:00Z',
      }
    ];

    let content = '';
    let contentType = '';
    let filename = '';

    switch (format) {
      case 'csv':
        // CSV header
        content = 'title,description,category,status,priority,duration,color,tags,notes,scheduledFor\n';
        // CSV data rows
        sampleSessions.forEach(session => {
          const row = [
            `"${session.title}"`,
            `"${session.description}"`,
            session.category,
            session.status,
            session.priority,
            session.duration,
            session.color,
            `"${session.tags.join(',')}"`,
            `"${session.notes}"`,
            session.scheduledFor
          ].join(',');
          content += row + '\n';
        });
        contentType = 'text/csv';
        filename = 'sessions-sample.csv';
        break;

      case 'json':
        content = JSON.stringify(sampleSessions, null, 2);
        contentType = 'application/json';
        filename = 'sessions-sample.json';
        break;

      case 'xml':
        content = '<?xml version="1.0" encoding="UTF-8"?>\n';
        content += '<sessions>\n';
        sampleSessions.forEach(session => {
          content += '  <session>\n';
          content += `    <title>${session.title}</title>\n`;
          content += `    <description>${session.description}</description>\n`;
          content += `    <category>${session.category}</category>\n`;
          content += `    <status>${session.status}</status>\n`;
          content += `    <priority>${session.priority}</priority>\n`;
          content += `    <duration>${session.duration}</duration>\n`;
          content += `    <color>${session.color}</color>\n`;
          content += '    <tags>\n';
          session.tags.forEach(tag => {
            content += `      <tag>${tag}</tag>\n`;
          });
          content += '    </tags>\n';
          content += `    <notes>${session.notes}</notes>\n`;
          content += `    <scheduledFor>${session.scheduledFor}</scheduledFor>\n`;
          content += '  </session>\n';
        });
        content += '</sessions>';
        contentType = 'application/xml';
        filename = 'sessions-sample.xml';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
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
