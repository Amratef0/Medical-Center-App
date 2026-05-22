import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentPlan } from './treatment-plan.entity';
import { TreatmentPlanService } from './treatment-plan-service.entity';
import { CreateTreatmentPlanDto, UpdateTreatmentPlanDto } from './dto/treatment-plan.dto';

@Injectable()
export class TreatmentPlansService {
  constructor(
    @InjectRepository(TreatmentPlan)
    private plansRepo: Repository<TreatmentPlan>,
    @InjectRepository(TreatmentPlanService)
    private planServicesRepo: Repository<TreatmentPlanService>,
  ) {}

  async create(dto: CreateTreatmentPlanDto): Promise<TreatmentPlan> {
    const { plan_services, ...planData } = dto;
    const plan = this.plansRepo.create(planData);
    const saved = await this.plansRepo.save(plan);

    if (plan_services?.length) {
      const services = plan_services.map((s) =>
        this.planServicesRepo.create({ ...s, treatment_plan_id: saved.id }),
      );
      await this.planServicesRepo.save(services);
    }

    return this.findOne(saved.id);
  }

  async findAll(): Promise<TreatmentPlan[]> {
    return this.plansRepo.find({
      relations: ['patient', 'doctor', 'plan_services'],
      order: { created_at: 'DESC' },
    });
  }

  async findByPatient(patientId: string): Promise<TreatmentPlan[]> {
    return this.plansRepo.find({
      where: { patient_id: patientId },
      relations: ['doctor', 'plan_services'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TreatmentPlan> {
    const plan = await this.plansRepo.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'plan_services'],
    });
    if (!plan) throw new NotFoundException('Treatment plan not found');
    return plan;
  }

  async update(id: string, dto: UpdateTreatmentPlanDto): Promise<TreatmentPlan> {
    const plan = await this.findOne(id);
    const { plan_services, ...planData } = dto;
    Object.assign(plan, planData);
    await this.plansRepo.save(plan);

    if (plan_services?.length) {
      await this.planServicesRepo.delete({ treatment_plan_id: id });
      const services = plan_services.map((s) =>
        this.planServicesRepo.create({ ...s, treatment_plan_id: id }),
      );
      await this.planServicesRepo.save(services);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.plansRepo.remove(plan);
  }
}
