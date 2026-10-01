import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mcsos-system-production.up.railway.app',
];

function parseCorsOrigins(raw: string | undefined): string[] {
  const fromEnv = (raw || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_CORS_ORIGINS, ...fromEnv])];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const corsOrigins = parseCorsOrigins(config.get<string>('CORS_ORIGINS'));

  const helmetOptions = {
    // The UI is a different Railway host. same-origin would block those fetches.
    crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  };

  app.use((req, res, next) => {
    const isSwagger =
      req.path === '/api/docs' ||
      req.path.startsWith('/api/docs/') ||
      req.path.startsWith('/api/docs-json');
    if (isSwagger) {
      return helmet({ ...helmetOptions, contentSecurityPolicy: false })(req, res, next);
    }
    return helmet(helmetOptions)(req, res, next);
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
      // Do not throw. An Error here becomes a 500 with no CORS headers,
      // and the browser reports a failed fetch instead of a clear denial.
      callback(null, false);
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
