import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { ScheduleSlot } from '../scheduling/schedule-slot.entity';
import { Payment } from '../finance/payment.entity';
import { Invoice } from '../finance/invoice.entity';
import { PatientPackage } from '../packages/patient-package.entity';
import { FollowUpTask } from '../follow-ups/follow-up.entity';
import { Patient } from '../patients/patient.entity';
import { Session } from '../sessions/session.entity';
import { CapacityModule } from '../capacity/capacity.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleSlot,
      Payment,
      Invoice,
      PatientPackage,
      FollowUpTask,
      Patient,
      Session,
    ]),
    CapacityModule,
    SettingsModule,
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
