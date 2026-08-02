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
import { Room } from '../rooms/room.entity';

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

export enum SessionConfirmStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
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

  @ManyToOne(() => Room, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  room_id: string;

  @ApiProperty({ enum: SessionConfirmStatus })
  @Column({
    type: 'enum',
    enum: SessionConfirmStatus,
    default: SessionConfirmStatus.PENDING,
  })
  confirm_status: SessionConfirmStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  start_time: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  end_time: Date;

  @ApiProperty({ default: false })
  @Column({ default: false })
  payment_verified: boolean;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  payment_verified_by: string;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  payment_verified_at: Date;

  @ApiProperty({ default: 60, description: 'Configurable duration in minutes for assessment/treatment (30, 60, 90)' })
  @Column({ default: 60 })
  scheduled_duration_minutes: number;

  @ApiProperty({ required: false, description: 'Actual elapsed duration in minutes calculated on checkout/end' })
  @Column({ nullable: true })
  actual_duration_minutes: number;

  @ApiProperty({ default: false, description: 'True if assessment finished significantly earlier than scheduled' })
  @Column({ default: false })
  duration_warning_generated: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  evaluation_report: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
