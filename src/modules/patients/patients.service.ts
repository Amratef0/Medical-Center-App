import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient, PatientStatus } from './patient.entity';
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

  private generateProfileNumber(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'PRF-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  public calculateAge(dateOfBirth?: Date | string | null): number | null {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }

  private formatPatient(patient: Patient) {
    return {
      ...patient,
      age: this.calculateAge(patient.date_of_birth),
    };
  }

  async create(dto: CreatePatientDto, createdBy: User): Promise<any> {
    const patient = this.patientsRepo.create({
      ...dto,
      patient_code: this.generatePatientCode(),
      profile_number: this.generateProfileNumber(),
      created_by_id: createdBy.id,
    });
    const saved = await this.patientsRepo.save(patient);
    return this.formatPatient(saved);
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const qb = this.patientsRepo.createQueryBuilder('patient');

    if (search) {
      qb.where(
        '(patient.first_name ILIKE :s OR patient.last_name ILIKE :s OR patient.full_name_ar ILIKE :s OR patient.phone ILIKE :s OR patient.email ILIKE :s OR patient.patient_code ILIKE :s OR patient.profile_number ILIKE :s OR patient.nationality ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('patient.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((p) => this.formatPatient(p)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<any> {
    const patient = await this.patientsRepo.findOne({
      where: { id },
      relations: ['medical_history', 'treatment_plans'],
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return this.formatPatient(patient);
  }

  async update(id: string, dto: UpdatePatientDto): Promise<any> {
    const patient = await this.patientsRepo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    Object.assign(patient, dto);
    const updated = await this.patientsRepo.save(patient);
    return this.formatPatient(updated);
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

  async completeAssessment(id: string): Promise<any> {
    const patient = await this.findOne(id);
    patient.status = PatientStatus.ASSESSMENT_COMPLETED;
    await this.patientsRepo.save(patient);
    return {
      message: 'Assessment completed successfully',
      patient,
    };
  }
}