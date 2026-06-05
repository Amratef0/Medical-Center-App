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
import { Payment } from './payment.entity';

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('invoices')
export class Invoice {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Auto-generated invoice number' })
  @Column({ unique: true })
  invoice_number: string;

  @ApiProperty({ description: 'References patients table' })
  @Column()
  patient_id: string;

  @ManyToOne(() => Payment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  payment_id: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @ApiProperty({ enum: InvoiceStatus })
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING,
  })
  status: InvoiceStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  issued_at: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  paid_at: Date;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
