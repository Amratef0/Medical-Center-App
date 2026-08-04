import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum ServiceCategory {
  NEURO_PT = 'NEURO_PT',
  ORTHO_PT = 'ORTHO_PT',
  PEDIATRIC_PT = 'PEDIATRIC_PT',
  SPEECH_THERAPY = 'SPEECH_THERAPY',
  NUTRITION = 'NUTRITION',
  GENERAL = 'GENERAL',
}

@Entity('services')
export class Service {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ enum: ServiceCategory, default: ServiceCategory.GENERAL })
  @Column({
    type: 'enum',
    enum: ServiceCategory,
    default: ServiceCategory.GENERAL,
  })
  category: ServiceCategory;

  @ApiProperty({ description: 'Base price for this service', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @ApiProperty({ description: 'Session duration string (e.g. 30-45 د)', required: false })
  @Column({ nullable: true })
  duration: string;

  @ApiProperty({ description: 'Price per session in a 6-session package', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_package_6: number;

  @ApiProperty({ description: 'Price per session in a 12+ session package', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price_package_12: number;

  @ApiProperty({ description: 'Additional notes or remarks', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ description: 'Sort order within category', default: 100 })
  @Column({ default: 100 })
  sort_order: number;

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
