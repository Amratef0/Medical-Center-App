import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { DoctorAvailability } from './doctor-availability.entity';
import { TreatmentPlan } from '../treatment-plans/treatment-plan.entity';
import { Session } from '../sessions/session.entity';

@Entity('doctors')
export class Doctor {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  specialization: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  email: string;

  @ApiProperty()
  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => DoctorAvailability, (da) => da.doctor)
  availability: DoctorAvailability[];

  @OneToMany(() => TreatmentPlan, (tp) => tp.doctor)
  treatment_plans: TreatmentPlan[];

  @OneToMany(() => Session, (s) => s.doctor)
  sessions: Session[];

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
