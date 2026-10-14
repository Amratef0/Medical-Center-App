import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PatientPackage } from './patient-package.entity';
import { Service } from '../services/service.entity';

@Entity('patient_package_services')
@Unique(['patient_package_id', 'service_id'])
export class PatientPackageService {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PatientPackage, (pp) => pp.quotas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_package_id' })
  patient_package: PatientPackage;

  @ApiProperty()
  @Column()
  patient_package_id: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ApiProperty()
  @Column()
  service_id: string;

  @ApiProperty()
  @Column({ name: 'session_count', default: 0 })
  session_count: number;

  @ApiProperty()
  @Column({ name: 'remaining_sessions', default: 0 })
  remaining_sessions: number;
}
