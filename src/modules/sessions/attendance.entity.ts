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

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}
