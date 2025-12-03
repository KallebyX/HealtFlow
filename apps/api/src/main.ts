import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: configService.get('CORS_CREDENTIALS', 'true') === 'true',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Validation
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

  // Swagger
  if (configService.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HealthFlow API')
      .setDescription('API do Sistema de Gestão de Saúde HealthFlow')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticação e autorização')
      .addTag('patients', 'Gestão de pacientes')
      .addTag('doctors', 'Gestão de médicos')
      .addTag('clinics', 'Gestão de clínicas')
      .addTag('appointments', 'Agendamento de consultas')
      .addTag('consultations', 'Consultas médicas (SOAP)')
      .addTag('prescriptions', 'Prescrições digitais')
      .addTag('laboratory', 'Exames laboratoriais')
      .addTag('telemedicine', 'Telemedicina')
      .addTag('gamification', 'Gamificação')
      .addTag('billing', 'Faturamento')
      .addTag('notifications', 'Notificações')
      .addTag('analytics', 'Analytics e relatórios')
      .addTag('fhir', 'Integração FHIR R4')
      .addTag('rnds', 'Integração RNDS (DATASUS)')
      .addTag('storage', 'Gerenciamento de arquivos')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger docs available at /${apiPrefix}/docs`);
  }

  // Health check endpoint
  app.getHttpAdapter().get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  const port = configService.get('API_PORT', 3001);
  await app.listen(port);

  logger.log(`HealthFlow API running on port ${port}`);
  logger.log(`API Docs: http://localhost:${port}/docs`);
  logger.log(`Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap();
