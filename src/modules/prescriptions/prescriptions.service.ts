import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './prescription.entity';
import { PatientReport } from './patient-report.entity';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Session } from '../sessions/session.entity';
import {
  CreatePatientReportDto,
  CreatePrescriptionDto,
  UpdatePatientReportDto,
  UpdatePrescriptionDto,
} from './dto/prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private readonly prescriptionsRepo: Repository<Prescription>,
    @InjectRepository(PatientReport)
    private readonly reportsRepo: Repository<PatientReport>,
    @InjectRepository(Patient)
    private readonly patientsRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorsRepo: Repository<Doctor>,
    @InjectRepository(Session)
    private readonly sessionsRepo: Repository<Session>,
  ) {}

  async create(dto: CreatePrescriptionDto): Promise<Prescription> {
    await this.assertPatient(dto.patient_id);
    await this.assertOptionalDoctor(dto.doctor_id);
    await this.assertOptionalSession(dto.session_id);
    const row = this.prescriptionsRepo.create({
      patient_id: dto.patient_id,
      doctor_id: dto.doctor_id || null,
      session_id: dto.session_id || null,
      medications: dto.medications ?? [],
      attachment_ref: dto.attachment_ref ?? null,
      notes: dto.notes ?? null,
      status: dto.status || 'active',
      prescribed_on: dto.date || null,
    });
    return this.prescriptionsRepo.save(row);
  }

  findAll(): Promise<Prescription[]> {
    return this.prescriptionsRepo.find({
      relations: { patient: true, doctor: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Prescription> {
    const row = await this.prescriptionsRepo.findOne({
      where: { id },
      relations: { patient: true, doctor: true },
    });
    if (!row) throw new NotFoundException('Prescription not found');
    return row;
  }

  findByPatient(patientId: string): Promise<Prescription[]> {
    return this.prescriptionsRepo.find({
      where: { patient_id: patientId },
      relations: { patient: true, doctor: true },
      order: { created_at: 'DESC' },
    });
  }

  findByDoctor(doctorId: string): Promise<Prescription[]> {
    return this.prescriptionsRepo.find({
      where: { doctor_id: doctorId },
      relations: { patient: true, doctor: true },
      order: { created_at: 'DESC' },
    });
  }

  async update(id: string, dto: UpdatePrescriptionDto): Promise<Prescription> {
    const row = await this.findOne(id);
    if (dto.patient_id) {
      await this.assertPatient(dto.patient_id);
      row.patient_id = dto.patient_id;
    }
    if (dto.doctor_id !== undefined) {
      await this.assertOptionalDoctor(dto.doctor_id);
      row.doctor_id = dto.doctor_id || null;
    }
    if (dto.session_id !== undefined) {
      await this.assertOptionalSession(dto.session_id);
      row.session_id = dto.session_id || null;
    }
    if (dto.medications !== undefined) row.medications = dto.medications;
    if (dto.attachment_ref !== undefined) row.attachment_ref = dto.attachment_ref ?? null;
    if (dto.notes !== undefined) row.notes = dto.notes ?? null;
    if (dto.status !== undefined) row.status = dto.status || 'active';
    if (dto.date !== undefined) row.prescribed_on = dto.date || null;
    return this.prescriptionsRepo.save(row);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOne(id);
    await this.prescriptionsRepo.remove(row);
  }

  async createReport(patientId: string, dto: CreatePatientReportDto): Promise<PatientReport> {
    await this.assertPatient(patientId);
    const row = this.reportsRepo.create({
      patient_id: patientId,
      title: dto.title,
      content: dto.content ?? '',
      report_type: dto.report_type || dto.type || 'medical',
    });
    return this.reportsRepo.save(row);
  }

  findReports(patientId: string): Promise<PatientReport[]> {
    return this.reportsRepo.find({
      where: { patient_id: patientId },
      order: { created_at: 'DESC' },
    });
  }

  async updateReport(
    patientId: string,
    reportId: string,
    dto: UpdatePatientReportDto,
  ): Promise<PatientReport> {
    const row = await this.findReport(patientId, reportId);
    if (dto.title !== undefined) row.title = dto.title;
    if (dto.content !== undefined) row.content = dto.content;
    if (dto.report_type !== undefined || dto.type !== undefined) {
      row.report_type = dto.report_type || dto.type || row.report_type;
    }
    return this.reportsRepo.save(row);
  }

  async removeReport(patientId: string, reportId: string): Promise<void> {
    const row = await this.findReport(patientId, reportId);
    await this.reportsRepo.remove(row);
  }

  private async findReport(patientId: string, reportId: string): Promise<PatientReport> {
    const row = await this.reportsRepo.findOne({
      where: { id: reportId, patient_id: patientId },
    });
    if (!row) throw new NotFoundException('Patient report not found');
    return row;
  }

  private async assertPatient(id: string): Promise<void> {
    const patient = await this.patientsRepo.findOne({ where: { id } });
    if (!patient) throw new BadRequestException('Patient not found');
  }

  private async assertOptionalDoctor(id?: string): Promise<void> {
    if (!id) return;
    const doctor = await this.doctorsRepo.findOne({ where: { id } });
    if (!doctor) throw new BadRequestException('Doctor not found');
  }

  private async assertOptionalSession(id?: string): Promise<void> {
    if (!id) return;
    const session = await this.sessionsRepo.findOne({ where: { id } });
    if (!session) throw new BadRequestException('Session not found');
  }
}
