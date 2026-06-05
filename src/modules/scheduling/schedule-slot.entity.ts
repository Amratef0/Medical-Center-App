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
import { Service } from '../services/service.entity';

export enum SlotType {
  BULK = 'BULK',
  DYNAMIC = 'DYNAMIC',
}

@Entity('schedule_slots')
export class ScheduleSlot {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'References doctors table (owned by Dev A)' })
  @Column({ nullable: true })
  doctor_id: string;

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  service_id: string;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  start_time: Date;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  end_time: Date;

  @ApiProperty({ description: 'Max patients for this slot' })
  @Column({ default: 1 })
  capacity: number;

  @ApiProperty({ description: 'Current number of bookings' })
  @Column({ default: 0 })
  booked_count: number;

  @ApiProperty({ enum: SlotType })
  @Column({
    type: 'enum',
    enum: SlotType,
    nullable: true,
  })
  type: SlotType;

  @ApiProperty()
  @Column({ default: true })
  is_available: boolean;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
