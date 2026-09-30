import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './prescription.entity';
import { PatientReport } from './patient-report.entity';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Session } from '../sessions/session.entity';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PatientReportsController } from './patient-reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Prescription, PatientReport, Patient, Doctor, Session])],
  providers: [PrescriptionsService],
  controllers: [PrescriptionsController, PatientReportsController],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
