import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PackagesService } from './packages.service';
import {
  PackagesController,
  PatientPackagesController,
} from './packages.controller';
import { Package } from './package.entity';
import { PackageService } from './package-service.entity';
import { PatientPackage } from './patient-package.entity';
import { Session } from '../sessions/session.entity';
import { SchedulingModule } from '../scheduling/scheduling.module';
import { Doctor } from '../doctors/doctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Package, PackageService, PatientPackage, Session, Doctor]),
    SchedulingModule,
  ],
  controllers: [PackagesController, PatientPackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
