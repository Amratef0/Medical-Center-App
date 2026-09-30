import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

function parseCorsOrigins(raw: string | undefined): string[] {
  const fallback = 'http://localhost:5173,http://localhost:3000';
  return (raw || fallback)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const corsOrigins = parseCorsOrigins(config.get<string>('CORS_ORIGINS'));

  app.use((req, res, next) => {
    const isSwagger =
      req.path === '/api/docs' ||
      req.path.startsWith('/api/docs/') ||
      req.path.startsWith('/api/docs-json');
    if (isSwagger) {
      return helmet({ contentSecurityPolicy: false })(req, res, next);
    }
    return helmet()(req, res, next);
  });

  // Default Express body size limits apply. Large uploads: see T-011.

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      // No Origin (curl, same-origin, server-to-server) — allow.
      if (!origin) {
        callback(null, true);
        return;
      }
      // With credentials: 'include', the allowlist must echo the request Origin
      // string. callback(null, true) can leave Access-Control-Allow-Credentials empty.
      if (corsOrigins.includes(origin)) {
        callback(null, origin);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-User-Role',
      'X-Storage-Key',
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MCSOS API')
    .setDescription('Medical Center Scheduling & Operations System')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Patients', 'Patient management')
    .addTag('Medical History', 'Patient medical history')
    .addTag('Doctors', 'Doctor management')
    .addTag('Doctor Availability', 'Doctor availability slots')
    .addTag('Treatment Plans', 'Treatment plan management')
    .addTag('Sessions', 'Session management')
    .addTag('Attendance', 'Session attendance')
    .addTag('Waitlist', 'Waitlist management')
    .addTag('Services', 'Service catalog management')
    .addTag('Packages', 'Package management')
    .addTag('Patient Packages', 'Patient package assignment & tracking')
    .addTag('Scheduling', 'Scheduling engine & slot management')
    .addTag('Finance', 'Payments, discounts & invoices')
    .addTag('Follow-ups', 'Follow-up tasks & WhatsApp automation')
    .addTag('Reporting', 'Reports & analytics')
    .addTag('Attachments', 'File uploads & downloads')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 MCSOS API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
