import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Session } from '../sessions/session.entity';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'uuid', nullable: true })
  doctor_id: string | null;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor | null;

  @Column({ type: 'uuid', nullable: true })
  session_id: string | null;

  @ManyToOne(() => Session, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_id' })
  session: Session | null;

  @Column({ type: 'jsonb', default: [] })
  medications: Record<string, unknown>[];

  @Column({ type: 'varchar', nullable: true })
  attachment_ref: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  prescribed_on: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
