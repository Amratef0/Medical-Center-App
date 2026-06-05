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
import { PatientPackage } from '../packages/patient-package.entity';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('payments')
export class Payment {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'References patients table' })
  @Column()
  patient_id: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  package_id: string;

  @ManyToOne(() => PatientPackage, { nullable: true })
  @JoinColumn({ name: 'patient_package_id' })
  patient_package: PatientPackage;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  patient_package_id: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ required: false, default: 0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  discount_type: string;

  @ApiProperty({ enum: PaymentStatus })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({ enum: ApprovalStatus })
  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approval_status: ApprovalStatus;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  approved_by: string;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
