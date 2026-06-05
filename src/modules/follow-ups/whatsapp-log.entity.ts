import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { FollowUpTask } from './follow-up.entity';

export enum WhatsAppMessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity('whatsapp_logs')
export class WhatsAppLog {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'References patients table' })
  @Column({ nullable: true })
  patient_id: string;

  @ManyToOne(() => FollowUpTask, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'followup_task_id' })
  followup_task: FollowUpTask;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  followup_task_id: string;

  @ApiProperty()
  @Column()
  phone_number: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  template_name: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  message_body: string;

  @ApiProperty({ enum: WhatsAppMessageStatus })
  @Column({
    type: 'enum',
    enum: WhatsAppMessageStatus,
    default: WhatsAppMessageStatus.PENDING,
  })
  status: WhatsAppMessageStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  sent_at: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  error_message: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}
