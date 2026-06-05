import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';

@Entity('waitlist')
export class Waitlist {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, (p) => p.waitlist_entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ApiProperty()
  @Column()
  patient_id: string;

  @ApiProperty({ description: 'service_id from services table (owned by partner)', required: false })
  @Column({ nullable: true })
  service_id: string;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  doctor_id: string;

  @ApiProperty({ required: false })
  @Column({ type: 'date', nullable: true })
  preferred_date: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'time', nullable: true })
  preferred_time: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}
