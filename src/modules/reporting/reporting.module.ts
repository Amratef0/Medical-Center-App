import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { ScheduleSlot } from '../scheduling/schedule-slot.entity';
import { Payment } from '../finance/payment.entity';
import { PatientPackage } from '../packages/patient-package.entity';
import { FollowUpTask } from '../follow-ups/follow-up.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleSlot,
      Payment,
      PatientPackage,
      FollowUpTask,
    ]),
  ],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
