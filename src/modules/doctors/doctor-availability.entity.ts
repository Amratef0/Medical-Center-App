import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Doctor } from './doctor.entity';

@Entity('doctor_availability')
@Check('"day_of_week" BETWEEN 0 AND 6')
export class DoctorAvailability {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, (d) => d.availability, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ApiProperty()
  @Column()
  doctor_id: string;

  @ApiProperty({ description: '0=Sunday, 6=Saturday' })
  @Column()
  day_of_week: number;

  @ApiProperty()
  @Column({ type: 'time' })
  start_time: string;

  @ApiProperty()
  @Column({ type: 'time' })
  end_time: string;

  @ApiProperty()
  @Column({ default: 1 })
  slot_capacity: number;

  @ApiProperty()
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
