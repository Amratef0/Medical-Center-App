import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum AttachmentOwnerType {
  PATIENT = 'patient',
  SESSION = 'session',
  PRESCRIPTION = 'prescription',
}

export enum AttachmentKind {
  NATIONAL_ID_FRONT = 'national_id_front',
  NATIONAL_ID_BACK = 'national_id_back',
  REPORT = 'report',
  PRESCRIPTION_SCAN = 'prescription_scan',
}

@Entity('attachments')
export class Attachment {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: AttachmentOwnerType })
  @Column({ type: 'varchar', length: 32 })
  owner_type: AttachmentOwnerType;

  @ApiProperty()
  @Column({ type: 'uuid' })
  owner_id: string;

  @ApiProperty({ enum: AttachmentKind })
  @Column({ type: 'varchar', length: 64 })
  kind: AttachmentKind;

  @ApiProperty()
  @Column({ type: 'varchar', length: 512 })
  storage_key: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 128 })
  mime_type: string;

  @ApiProperty()
  @Column({ type: 'integer' })
  size_bytes: number;

  @ApiProperty()
  @Column({ type: 'uuid', nullable: true })
  uploaded_by: string | null;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
