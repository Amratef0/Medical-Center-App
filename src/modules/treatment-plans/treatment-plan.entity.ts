import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { TreatmentPlanService } from './treatment-plan-service.entity';
import { Session } from '../sessions/session.entity';

@Entity('treatment_plans')
export class TreatmentPlan {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, (p) => p.treatment_plans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ApiProperty()
  @Column()
  patient_id: string;

  @ManyToOne(() => Doctor, (d) => d.treatment_plans, { nullable: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  doctor_id: string;

  @ApiProperty()
  @Column()
  total_sessions: number;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  frequency: string;

  @ApiProperty()
  @Column({ default: 'ACTIVE' })
  status: string;

  @OneToMany(() => TreatmentPlanService, (tps) => tps.treatment_plan, { cascade: true })
  plan_services: TreatmentPlanService[];

  @OneToMany(() => Session, (s) => s.treatment_plan)
  sessions: Session[];

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
