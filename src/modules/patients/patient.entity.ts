import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { MedicalHistory } from './medical-history.entity';
import { TreatmentPlan } from '../treatment-plans/treatment-plan.entity';
import { Session } from '../sessions/session.entity';
import { Waitlist } from '../waitlist/waitlist.entity';

export enum PatientStatus {
  PENDING_ASSESSMENT = 'PENDING_ASSESSMENT',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  ASSESSMENT_DROPOFF = 'ASSESSMENT_DROPOFF',
}

@Entity('patients')
export class Patient {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true, length: 50 })
  patient_code: string;

  @ApiProperty()
  @Column()
  first_name: string;

  @ApiProperty()
  @Column()
  last_name: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  gender: string;

  @ApiProperty({ required: false })
  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  address: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  whatsapp_number: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  referral_source: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  national_id_photo: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  emergency_contact: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  email: string;

  @ApiProperty({ enum: PatientStatus })
  @Column({ type: 'enum', enum: PatientStatus, default: PatientStatus.PENDING_ASSESSMENT })
  status: PatientStatus;

  @ApiProperty()
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  registration_date: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @Column({ nullable: true })
  created_by_id: string;

  @OneToOne(() => MedicalHistory, (mh) => mh.patient)
  medical_history: MedicalHistory;

  @OneToMany(() => TreatmentPlan, (tp) => tp.patient)
  treatment_plans: TreatmentPlan[];

  @OneToMany(() => Session, (s) => s.patient)
  sessions: Session[];

  @OneToMany(() => Waitlist, (w) => w.patient)
  waitlist_entries: Waitlist[];

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
