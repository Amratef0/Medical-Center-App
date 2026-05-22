import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 MCSOS API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
