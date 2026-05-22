import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { DoctorsController, DoctorAvailabilityController } from './doctors.controller';
import { Doctor } from './doctor.entity';
import { DoctorAvailability } from './doctor-availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, DoctorAvailability])],
  controllers: [DoctorsController, DoctorAvailabilityController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
