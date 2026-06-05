import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { TreatmentPlan } from '../treatment-plans/treatment-plan.entity';
import { Attendance } from './attendance.entity';

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  ATTENDED = 'ATTENDED',
  MISSED = 'MISSED',
  CANCELED = 'CANCELED',
}

export enum SessionType {
  ASSESSMENT = 'ASSESSMENT',
  TREATMENT = 'TREATMENT',
  FOLLOWUP = 'FOLLOWUP',
}

@Entity('sessions')
export class Session {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, (p) => p.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ApiProperty()
  @Column()
  patient_id: string;

  @ManyToOne(() => Doctor, (d) => d.sessions, { nullable: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  doctor_id: string;

  @ApiProperty({ description: 'service_id from services table (owned by partner)', required: false })
  @Column({ nullable: true })
  service_id: string;

  @ApiProperty({ description: 'slot_id from schedule_slots table (owned by partner)', required: false })
  @Column({ nullable: true })
  slot_id: string;

  @ManyToOne(() => TreatmentPlan, (tp) => tp.sessions, { nullable: true })
  @JoinColumn({ name: 'treatment_plan_id' })
  treatment_plan: TreatmentPlan;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  treatment_plan_id: string;

  @ApiProperty({ description: 'patient_package_id from patient_packages table (owned by partner)', required: false })
  @Column({ nullable: true })
  patient_package_id: string;

  @ApiProperty({ enum: SessionType })
  @Column({ type: 'enum', enum: SessionType })
  session_type: SessionType;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  session_date: Date;

  @ApiProperty({ enum: SessionStatus })
  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.SCHEDULED })
  status: SessionStatus;

  @ApiProperty()
  @Column({ default: false })
  is_deducted: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  deducted_at: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  doctor_notes: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  reception_notes: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  absence_reason: string;

  @OneToOne(() => Attendance, (a) => a.session)
  attendance: Attendance;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
