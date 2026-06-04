import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { TreatmentPlansModule } from './modules/treatment-plans/treatment-plans.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    DatabaseModule,

    AuthModule,
    UsersModule,
    PatientsModule,
    DoctorsModule,
    TreatmentPlansModule,
    SessionsModule,
    WaitlistModule,
  ],
})
export class AppModule {}