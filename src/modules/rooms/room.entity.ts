import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('rooms')
export class Room {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ unique: true })
  code: string;

  @ApiProperty()
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty({ default: 1, description: 'Max overlapping sessions allowed in this room' })
  @Column({ type: 'int', default: 1 })
  max_concurrent_sessions: number;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
