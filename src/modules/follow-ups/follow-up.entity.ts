import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum FollowUpType {
  DROP_OFF = 'DROP_OFF',
  MISSED_SESSION = 'MISSED_SESSION',
  RENEWAL = 'RENEWAL',
}

export enum FollowUpStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

@Entity('follow_up_tasks')
export class FollowUpTask {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'References patients table' })
  @Column()
  patient_id: string;

  @ApiProperty({ enum: FollowUpType })
  @Column({
    type: 'enum',
    enum: FollowUpType,
    nullable: true,
  })
  type: FollowUpType;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  message: string;

  @ApiProperty({ enum: FollowUpStatus })
  @Column({
    type: 'enum',
    enum: FollowUpStatus,
    default: FollowUpStatus.PENDING,
  })
  status: FollowUpStatus;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
