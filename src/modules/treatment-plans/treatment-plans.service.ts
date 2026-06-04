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

  async findAll(page = 1, limit = 10, search?: string) {
    const qb = this.plansRepo
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.patient', 'patient')
      .leftJoinAndSelect('plan.doctor', 'doctor')
      .leftJoinAndSelect('plan.plan_services', 'plan_services');

    if (search) {
      qb.where(
        '(patient.first_name ILIKE :s OR patient.last_name ILIKE :s OR patient.patient_code ILIKE :s OR doctor.name ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('plan.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findByPatient(patientId: string, page = 1, limit = 10) {
    const [data, total] = await this.plansRepo
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.doctor', 'doctor')
      .leftJoinAndSelect('plan.plan_services', 'plan_services')
      .where('plan.patient_id = :patientId', { patientId })
      .orderBy('plan.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
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