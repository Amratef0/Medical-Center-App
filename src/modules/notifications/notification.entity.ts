import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  PACKAGE_ENDING_SOON = 'PACKAGE_ENDING_SOON',
  CAPACITY_LIMIT_REACHED = 'CAPACITY_LIMIT_REACHED',
  PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',
  ASSESSMENT_ENDED_EARLIER = 'ASSESSMENT_ENDED_EARLIER',
  MISSED_APPOINTMENT = 'MISSED_APPOINTMENT',
  ATTENDANCE_RECORDED = 'ATTENDANCE_RECORDED',
  DOCTOR_SCHEDULE_FULL = 'DOCTOR_SCHEDULE_FULL',
  GENERAL = 'GENERAL',
}

@Entity('notifications')
export class Notification {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: NotificationType })
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type: NotificationType;

  @ApiProperty()
  @Column()
  title: string;

  @ApiProperty()
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Target user role or ALL', default: 'ALL' })
  @Column({ default: 'ALL' })
  target_role: string;

  @ApiProperty()
  @Column({ default: false })
  is_read: boolean;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  reference_id: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}
