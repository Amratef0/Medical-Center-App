import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentPlansService } from './treatment-plans.service';
import { TreatmentPlansController } from './treatment-plans.controller';
import { TreatmentPlan } from './treatment-plan.entity';
import { TreatmentPlanService } from './treatment-plan-service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TreatmentPlan, TreatmentPlanService])],
  controllers: [TreatmentPlansController],
  providers: [TreatmentPlansService],
  exports: [TreatmentPlansService],
})
export class TreatmentPlansModule {}
