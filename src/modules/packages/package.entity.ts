import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PackageService } from './package-service.entity';
import { PatientPackage } from './patient-package.entity';

@Entity('packages')
export class Package {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Total sessions included in this package' })
  @Column()
  total_sessions: number;

  @ApiProperty({ description: 'Number of days until package expires after activation', required: false })
  @Column({ nullable: true })
  expiry_days: number;

  @ApiProperty({ description: 'Package price', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @ApiProperty({ default: false })
  @Column({ default: false })
  is_custom: boolean;

  @ApiProperty()
  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => PackageService, (ps) => ps.package, { cascade: true })
  package_services: PackageService[];

  @OneToMany(() => PatientPackage, (pp) => pp.package)
  patient_packages: PatientPackage[];

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
