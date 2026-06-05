import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Package } from './package.entity';
import { Service } from '../services/service.entity';

@Entity('package_services')
@Unique(['package_id', 'service_id'])
export class PackageService {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Package, (p) => p.package_services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package: Package;

  @ApiProperty()
  @Column()
  package_id: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ApiProperty()
  @Column()
  service_id: string;

  @ApiProperty({ description: 'How many sessions of this service the package includes' })
  @Column({ name: 'session_count', default: 0 })
  session_count: number;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}
