import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TreatmentPlan } from './treatment-plan.entity';

@Entity('treatment_plan_services')
@Unique(['treatment_plan_id', 'service_id'])
export class TreatmentPlanService {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TreatmentPlan, (tp) => tp.plan_services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treatment_plan_id' })
  treatment_plan: TreatmentPlan;

  @ApiProperty()
  @Column()
  treatment_plan_id: string;

  @ApiProperty({ description: 'service_id from services table (owned by partner)' })
  @Column()
  service_id: string;

  @ApiProperty()
  @Column({ default: 1 })
  sessions_count: number;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}
