import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { SchedulingValidator } from './scheduling-validator.service';
import { ScheduleSlot } from './schedule-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleSlot])],
  controllers: [SchedulingController],
  providers: [SchedulingService, SchedulingValidator],
  exports: [SchedulingService, SchedulingValidator],
})
export class SchedulingModule {}
