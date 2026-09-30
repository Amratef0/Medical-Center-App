import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { Session } from '../sessions/session.entity';
import { PatientPackage } from '../packages/patient-package.entity';
import { Patient } from '../patients/patient.entity';
import { User } from '../users/user.entity';
import { Notification } from '../notifications/notification.entity';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CapacityModule } from '../capacity/capacity.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Session,
      PatientPackage,
      Patient,
      User,
      Notification,
    ]),
    SettingsModule,
    NotificationsModule,
    CapacityModule,
    WhatsappModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
