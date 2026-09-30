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
import { Patient } from '../patients/patient.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Package, PackageService, PatientPackage, Session, Doctor, Patient]),
    SchedulingModule,
    NotificationsModule,
    SettingsModule,
  ],
  controllers: [PackagesController, PatientPackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
