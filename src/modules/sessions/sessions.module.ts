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
import { FinanceModule } from '../finance/finance.module';
import { PackagesModule } from '../packages/packages.module';
import { Service } from '../services/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Attendance, Service]),
    SchedulingModule,
    NotificationsModule,
    CapacityModule,
    SettingsModule,
    FinanceModule,
    PackagesModule,
  ],
  controllers: [SessionsController, AttendanceController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
