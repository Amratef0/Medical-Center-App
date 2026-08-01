import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Session } from './session.entity';

export enum AttendanceStatus {
  ATTENDED = 'ATTENDED',
  ABSENT = 'ABSENT',
}

export enum AbsenceReason {
  PATIENT_CANCELLED = 'Patient Cancelled',
  NO_SHOW = 'No Show',
  EMERGENCY = 'Emergency',
  DOCTOR_UNAVAILABLE = 'Doctor Unavailable',
}

@Entity('attendance')
export class Attendance {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Session, (s) => s.attendance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Session;

  @ApiProperty()
  @Column()
  session_id: string;

  @ApiProperty({ enum: AttendanceStatus })
  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  reason: string;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  check_in_time: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  check_out_time: Date;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}
