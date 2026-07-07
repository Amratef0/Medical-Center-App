import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Package } from './package.entity';

export enum PatientPackageStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  EXHAUSTED = 'EXHAUSTED',
  SUSPENDED = 'SUSPENDED',
}

@Entity('patient_packages')
export class PatientPackage {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'References patients table (owned by Dev A)' })
  @Column()
  patient_id: string;

  @ManyToOne(() => Package, (p) => p.patient_packages)
  @JoinColumn({ name: 'package_id' })
  package: Package;

  @ApiProperty()
  @Column()
  package_id: string;

  @ApiProperty({ enum: PatientPackageStatus })
  @Column({
    type: 'enum',
    enum: PatientPackageStatus,
    default: PatientPackageStatus.ACTIVE,
  })
  status: PatientPackageStatus;

  @ApiProperty()
  @Column({ name: 'remaining_sessions' })
  remaining_sessions: number;

  @ApiProperty({ required: false })
  @Column({ type: 'date', nullable: true })
  start_date?: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'date', name: 'end_date', nullable: true })
  end_date?: Date;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({ description: 'Type of discount applied', required: false, enum: ['fixed', 'percentage'] })
  @Column({ type: 'enum', enum: ['fixed', 'percentage'], nullable: true })
  discount_type?: 'fixed' | 'percentage';

  @ApiProperty({ description: 'Discount amount', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discount_amount?: number;

  @ApiProperty({ description: 'Final price after discount', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  final_price?: number;

  @ApiProperty({ description: 'Additional notes', required: false })
  @Column({ type: 'text', nullable: true })
  notes?: string;
}
