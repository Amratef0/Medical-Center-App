import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { MedicalHistory } from './medical-history.entity';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { CreateMedicalHistoryDto, UpdateMedicalHistoryDto } from './dto/medical-history.dto';
import { User } from '../users/user.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepo: Repository<Patient>,
    @InjectRepository(MedicalHistory)
    private medicalHistoryRepo: Repository<MedicalHistory>,
  ) {}

  private generatePatientCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PT-${timestamp}${random}`;
  }

  async create(dto: CreatePatientDto, createdBy: User): Promise<Patient> {
    const patient = this.patientsRepo.create({
      ...dto,
      patient_code: this.generatePatientCode(),
      created_by_id: createdBy.id,
    });
    return this.patientsRepo.save(patient);
  }

  async findAll(): Promise<Patient[]> {
    return this.patientsRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientsRepo.findOne({
      where: { id },
      relations: ['medical_history', 'treatment_plans'],
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);
    Object.assign(patient, dto);
    return this.patientsRepo.save(patient);
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientsRepo.remove(patient);
  }

  // Medical History
  async createMedicalHistory(patientId: string, dto: CreateMedicalHistoryDto): Promise<MedicalHistory> {
    await this.findOne(patientId);
    const existing = await this.medicalHistoryRepo.findOne({ where: { patient_id: patientId } });
    if (existing) {
      Object.assign(existing, dto);
      return this.medicalHistoryRepo.save(existing);
    }
    const history = this.medicalHistoryRepo.create({ ...dto, patient_id: patientId });
    return this.medicalHistoryRepo.save(history);
  }

  async getMedicalHistory(patientId: string): Promise<MedicalHistory> {
    await this.findOne(patientId);
    const history = await this.medicalHistoryRepo.findOne({ where: { patient_id: patientId } });
    if (!history) throw new NotFoundException('Medical history not found');
    return history;
  }

  async updateMedicalHistory(patientId: string, dto: UpdateMedicalHistoryDto): Promise<MedicalHistory> {
    const history = await this.getMedicalHistory(patientId);
    Object.assign(history, dto);
    return this.medicalHistoryRepo.save(history);
  }
}
