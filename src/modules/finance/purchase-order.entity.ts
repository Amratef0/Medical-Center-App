import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('purchase_orders')
export class PurchaseOrder {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  po_number: string;

  @ApiProperty()
  @Column()
  vendor_name: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_amount: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  created_by: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
