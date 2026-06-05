import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { PatientsController, MedicalHistoryController } from './patients.controller';
import { Patient } from './patient.entity';
import { MedicalHistory } from './medical-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, MedicalHistory])],
  controllers: [PatientsController, MedicalHistoryController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
