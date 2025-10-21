import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaService } from '@common/prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Get ConfigService
  const configService = app.get(ConfigService);

  // Configure CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const origins = corsOrigin
    ? corsOrigin.split(',').map((origin) => origin.trim())
    : true; // Permissive default when not set

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Get PrismaService and enable shutdown hooks
  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Get port from environment and ensure it's a number
  const portString = configService.get<string>('PORT');
  let port: number = portString ? parseInt(portString, 10) : 4000;

  // Fallback to 4000 if port is NaN
  if (isNaN(port)) {
    console.error('❌ Invalid PORT environment variable, using default 4000');
    port = 4000;
  }

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Start server
  await app.listen(port);

  console.log(`🚀 API server is running on: http://localhost:${port}`);
  console.log(`📚 Health check available at: http://localhost:${port}/api/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});
