import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('whatsapp_templates')
export class WhatsAppTemplate {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name_ar: string;

  @ApiProperty()
  @Column()
  name_en: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  provider_template_name: string;

  @ApiProperty()
  @Column({ type: 'text' })
  message_ar: string;

  @ApiProperty()
  @Column({ type: 'text' })
  message_en: string;

  @ApiProperty({ description: 'Comma-separated variable names' })
  @Column({ type: 'text', default: '' })
  variables: string;

  @ApiProperty({ description: 'draft | pending | approved | rejected' })
  @Column({ default: 'draft' })
  approval_status: string;

  @ApiProperty()
  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
