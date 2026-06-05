import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('services')
export class Service {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Duration in minutes for this service' })
  @Column({ name: 'duration_minutes', default: 30 })
  duration_minutes: number;

  @ApiProperty({ description: 'Base price for this service', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

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
