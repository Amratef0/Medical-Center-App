import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CapacityModule } from './modules/capacity/capacity.module';
import { StorageModule } from './modules/storage/storage.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { JobsModule } from './modules/jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get('THROTTLE_TTL_MS') ?? 60_000),
          limit: Number(config.get('THROTTLE_LIMIT') ?? 100),
        },
      ],
    }),
    DatabaseModule,
    // Shared
    AuthModule,
    UsersModule,
    RoomsModule,
    WhatsappModule,
    NotificationsModule,
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
    ContractsModule,
    PrescriptionsModule,
    SettingsModule,
    CapacityModule,
    PermissionsModule,
    StorageModule,
    AttachmentsModule,
    JobsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
