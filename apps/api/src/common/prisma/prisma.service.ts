import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(configService: ConfigService) {
    const isDevelopment = configService.get('NODE_ENV') === 'development';

    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      log: isDevelopment ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
      errorFormat: isDevelopment ? 'pretty' : 'minimal',
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on('beforeExit', async () => {
      await this.$disconnect();
      await app.close();
    });
  }
}
