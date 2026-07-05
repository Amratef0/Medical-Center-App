import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

// Ebrahim-dev modules
import { ServicesModule } from './modules/services/services.module';
import { PackagesModule } from './modules/packages/packages.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { FinanceModule } from './modules/finance/finance.module';
import { FollowUpsModule } from './modules/follow-ups/follow-ups.module';
import { ReportingModule } from './modules/reporting/reporting.module';

// Amr-dev modules
import { PatientsModule } from './modules/patients/patients.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { TreatmentPlansModule } from './modules/treatment-plans/treatment-plans.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    // Shared
    AuthModule,
    UsersModule,
    RoomsModule,
    WhatsappModule,
    // Ebrahim-dev
    ServicesModule,
    PackagesModule,
    SchedulingModule,
    FinanceModule,
    FollowUpsModule,
    ReportingModule,
    // Amr-dev
    PatientsModule,
    DoctorsModule,
    TreatmentPlansModule,
    SessionsModule,
    WaitlistModule,
  ],
})
export class AppModule {}