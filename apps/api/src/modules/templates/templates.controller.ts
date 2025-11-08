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
import { TemplatesService } from './templates.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQuery,
  ApiResponse,
  TemplateResponse,
  TemplatesListResponse,
} from '@repo/shared-types';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateTemplateDto,
  ): Promise<ApiResponse<TemplateResponse>> {
    const template = await this.templatesService.create(userId, dto);

    return {
      success: true,
      message: 'Template created successfully',
      data: template,
    };
  }

  @Get()
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query() query: TemplateQuery,
  ): Promise<ApiResponse<TemplatesListResponse>> {
    // Destructure pagination and filter keys
    const { page, limit, sortBy, sortOrder, category, search, tags } = query;

    // Normalize tags to array
    const normalizedTags = tags
      ? Array.isArray(tags)
        ? tags
        : [tags]
      : undefined;

    const filters = { category, search, tags: normalizedTags };
    const pagination = { page, limit, sortBy, sortOrder };

    const result = await this.templatesService.findAll(
      userId,
      filters,
      pagination,
    );

    return {
      success: true,
      message: 'Templates retrieved successfully',
      data: result,
    };
  }

  @Get('search')
  async search(
    @CurrentUser('sub') userId: string,
    @Query('q') query: string,
  ): Promise<ApiResponse<TemplateResponse[]>> {
    const templates = await this.templatesService.search(userId, query);

    return {
      success: true,
      message: 'Templates found',
      data: templates,
    };
  }

  @Get(':id')
  async findOne(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<TemplateResponse>> {
    const template = await this.templatesService.findById(id, userId);

    return {
      success: true,
      message: 'Template retrieved successfully',
      data: template,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ): Promise<ApiResponse<TemplateResponse>> {
    const template = await this.templatesService.update(id, userId, dto);

    return {
      success: true,
      message: 'Template updated successfully',
      data: template,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.templatesService.delete(id, userId);
  }
}
