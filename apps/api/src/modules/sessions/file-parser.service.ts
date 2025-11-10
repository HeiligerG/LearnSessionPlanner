import { Injectable, BadRequestException } from '@nestjs/common';
import { parseString } from 'xml2js';
import { parse } from 'csv-parse/sync';
import type {
  CreateSessionDto,
  ParsedSessionRowDto,
} from '@repo/shared-types';
import {
  SessionCategory,
  SessionStatus,
  SessionPriority,
} from '@repo/shared-types';

@Injectable()
export class FileParserService {
  /**
   * Parse CSV content and return parsed session rows using RFC 4180 compliant parser
   */
  parseCSV(content: string): ParsedSessionRowDto[] {
    try {
      // Parse CSV with proper RFC 4180 compliance
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        relax_quotes: true,
        escape: '\\',
      });

      if (!records || records.length === 0) {
        throw new BadRequestException('CSV file must contain at least one data row');
      }

      const rows: ParsedSessionRowDto[] = [];

      for (let i = 0; i < records.length; i++) {
        try {
          const record = records[i];
          const session = this.parseCSVRecord(record, i + 1);
          const validatedRow = this.validateSession(session, i + 1);
          rows.push(validatedRow);
        } catch (error: any) {
          rows.push({
            rowNumber: i + 1,
            session: {} as CreateSessionDto,
            status: 'error',
            errors: [error.message || 'Unknown error'],
            warnings: [],
            isDuplicate: false,
          });
        }
      }

      this.detectDuplicates(rows);
      return rows;
    } catch (error: any) {
      throw new BadRequestException(`CSV parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse JSON content and return parsed session rows
   */
  parseJSON(content: string): ParsedSessionRowDto[] {
    try {
      const data = JSON.parse(content);
      let sessions: any[] = [];

      // Handle different JSON structures
      if (Array.isArray(data)) {
        sessions = data;
      } else if (data.sessions && Array.isArray(data.sessions)) {
        sessions = data.sessions;
      } else {
        throw new BadRequestException('JSON must contain an array of sessions or a "sessions" array property');
      }

      const rows: ParsedSessionRowDto[] = [];

      for (let i = 0; i < sessions.length; i++) {
        try {
          const sessionData = sessions[i];
          const session: CreateSessionDto = {
            title: sessionData.title,
            description: sessionData.description,
            category: sessionData.category,
            status: sessionData.status || 'planned',
            priority: sessionData.priority || 'medium',
            duration: sessionData.duration,
            color: sessionData.color,
            tags: Array.isArray(sessionData.tags) ? sessionData.tags : [],
            notes: sessionData.notes,
            scheduledFor: sessionData.scheduledFor,
          };

          const validatedRow = this.validateSession(session, i + 1);
          rows.push(validatedRow);
        } catch (error: any) {
          rows.push({
            rowNumber: i + 1,
            session: {} as CreateSessionDto,
            status: 'error',
            errors: [error.message || 'Unknown error'],
            warnings: [],
            isDuplicate: false,
          });
        }
      }

      this.detectDuplicates(rows);
      return rows;
    } catch (error: any) {
      throw new BadRequestException(`JSON parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse XML content and return parsed session rows
   */
  async parseXML(content: string): Promise<ParsedSessionRowDto[]> {
    return new Promise((resolve, reject) => {
      parseString(content, (error, result) => {
        if (error) {
          reject(new BadRequestException(`XML parsing failed: ${error.message}`));
          return;
        }

        try {
          const rows: ParsedSessionRowDto[] = [];
          let sessions: any[] = [];

          // Handle different XML structures
          if (result.sessions && result.sessions.session) {
            sessions = result.sessions.session;
          } else if (result.session) {
            sessions = result.session;
          } else {
            reject(new BadRequestException('XML must contain session elements'));
            return;
          }

          for (let i = 0; i < sessions.length; i++) {
            try {
              const sessionData = sessions[i];
              const session: CreateSessionDto = {
                title: this.getXMLValue(sessionData.title),
                description: this.getXMLValue(sessionData.description),
                category: this.getXMLValue(sessionData.category) as SessionCategory,
                status: (this.getXMLValue(sessionData.status) as SessionStatus) || 'planned',
                priority: (this.getXMLValue(sessionData.priority) as SessionPriority) || 'medium',
                duration: parseInt(this.getXMLValue(sessionData.duration) || '0'),
                color: this.getXMLValue(sessionData.color),
                tags: Array.isArray(sessionData.tags?.[0]?.tag) 
                  ? sessionData.tags[0].tag.map((t: any) => this.getXMLValue(t))
                  : [],
                notes: this.getXMLValue(sessionData.notes),
                scheduledFor: this.getXMLValue(sessionData.scheduledFor),
              };

              const validatedRow = this.validateSession(session, i + 1);
              rows.push(validatedRow);
            } catch (error: any) {
              rows.push({
                rowNumber: i + 1,
                session: {} as CreateSessionDto,
                status: 'error',
                errors: [error.message || 'Unknown error'],
                warnings: [],
                isDuplicate: false,
              });
            }
          }

          this.detectDuplicates(rows);
          resolve(rows);
        } catch (error: any) {
          reject(new BadRequestException(`XML processing failed: ${error.message}`));
        }
      });
    });
  }

  /**
   * Parse CSV record into session DTO
   */
  private parseCSVRecord(record: any, _rowNumber: number): CreateSessionDto {
    const session: any = {};

    // Map CSV columns to session fields with case-insensitive matching
    const fieldMap: Record<string, string> = {
      'title': 'title',
      'description': 'description',
      'category': 'category',
      'status': 'status',
      'priority': 'priority',
      'duration': 'duration',
      'color': 'color',
      'tags': 'tags',
      'notes': 'notes',
      'scheduledfor': 'scheduledFor',
      'scheduled_for': 'scheduledFor',
    };

    for (const [csvHeader, sessionField] of Object.entries(fieldMap)) {
      // Case-insensitive header matching
      const matchingKey = Object.keys(record).find(
        key => key.toLowerCase().trim() === csvHeader.toLowerCase()
      );

      if (matchingKey) {
        const value = record[matchingKey]?.trim() || '';

        switch (sessionField) {
          case 'title':
            session.title = value;
            break;
          case 'description':
            session.description = value || undefined;
            break;
          case 'category':
            session.category = value;
            break;
          case 'status':
            session.status = value || 'planned';
            break;
          case 'priority':
            session.priority = value || 'medium';
            break;
          case 'duration':
            session.duration = parseInt(value) || 0;
            break;
          case 'color':
            session.color = value || undefined;
            break;
          case 'tags':
            session.tags = value ? value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [];
            break;
          case 'notes':
            session.notes = value || undefined;
            break;
          case 'scheduledFor':
            session.scheduledFor = value || undefined;
            break;
        }
      }
    }

    return session as CreateSessionDto;
  }

  /**
   * Validate session data and return parsed row with status
   */
  private validateSession(session: any, rowNumber: number): ParsedSessionRowDto {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!session.title?.trim()) {
      errors.push('Title is required');
    }

    if (!session.category) {
      errors.push('Category is required');
    } else if (!Object.values(SessionCategory).includes(session.category)) {
      errors.push(`Invalid category: ${session.category}. Must be one of: ${Object.values(SessionCategory).join(', ')}`);
    }

    if (!session.duration || session.duration <= 0) {
      errors.push('Duration must be a positive number');
    }

    // Optional field validation
    if (session.status && !Object.values(SessionStatus).includes(session.status)) {
      warnings.push(`Invalid status: ${session.status}. Using default: planned`);
      session.status = 'planned';
    }

    if (session.priority && !Object.values(SessionPriority).includes(session.priority)) {
      warnings.push(`Invalid priority: ${session.priority}. Using default: medium`);
      session.priority = 'medium';
    }

    // Date validation
    if (session.scheduledFor) {
      const date = new Date(session.scheduledFor);
      if (isNaN(date.getTime())) {
        warnings.push(`Invalid date format for scheduledFor: ${session.scheduledFor}`);
        session.scheduledFor = undefined;
      }
    }

    // Tags validation
    if (session.tags && !Array.isArray(session.tags)) {
      warnings.push('Tags should be an array');
      session.tags = [];
    }

    const status: 'success' | 'warning' | 'error' = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success';

    return {
      rowNumber,
      session: session as CreateSessionDto,
      status,
      errors,
      warnings,
      isDuplicate: false,
    };
  }

  /**
   * Detect duplicate sessions within the file
   */
  private detectDuplicates(rows: ParsedSessionRowDto[]): void {
    const seen = new Map<string, number>();

    for (const row of rows) {
      if (row.status === 'error') continue;

      const key = `${row.session.title}-${row.session.scheduledFor}`;
      if (seen.has(key)) {
        row.isDuplicate = true;
        row.warnings.push(`Duplicate of row ${seen.get(key)}`);
        row.status = row.status === 'success' ? 'warning' : row.status;
      } else {
        seen.set(key, row.rowNumber);
      }
    }
  }

  /**
   * Extract value from XML element
   */
  private getXMLValue(element: any): string {
    if (!element) return '';
    if (Array.isArray(element) && element.length > 0) {
      return element[0];
    }
    return element.toString();
  }
}
