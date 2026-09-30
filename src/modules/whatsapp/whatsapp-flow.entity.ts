import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('whatsapp_flows')
export class WhatsAppFlow {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name_ar: string;

  @ApiProperty()
  @Column()
  name_en: string;

  @ApiProperty()
  @Column({ type: 'text' })
  message: string;

  @ApiProperty()
  @Column({ type: 'int', default: 24 })
  delay: number;

  @ApiProperty()
  @Column({ default: 'hours' })
  delay_unit: string;

  @ApiProperty()
  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
