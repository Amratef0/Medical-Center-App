import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  RECEPTIONIST = 'RECEPTIONIST',
  OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
  DOCTOR = 'DOCTOR',
  FINANCE = 'FINANCE',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @ApiProperty({ enum: UserRole })
  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @ApiProperty()
  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  refresh_token_hash: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
