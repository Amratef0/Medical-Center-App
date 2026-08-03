import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
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
