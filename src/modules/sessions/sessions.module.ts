import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsService } from './sessions.service';
import { SessionsController, AttendanceController } from './sessions.controller';
import { Session } from './session.entity';
import { Attendance } from './attendance.entity';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CapacityModule } from '../capacity/capacity.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Attendance]),
    SchedulingModule,
    NotificationsModule,
    CapacityModule,
    SettingsModule,
  ],
  controllers: [SessionsController, AttendanceController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
