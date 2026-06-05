import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Patient } from './patient.entity';

@Entity('medical_histories')
export class MedicalHistory {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Patient, (p) => p.medical_history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column()
  patient_id: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  allergies: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  chronic_diseases: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  medications: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  surgeries: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
