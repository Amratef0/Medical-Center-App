import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { PackagesModule } from './modules/packages/packages.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { FinanceModule } from './modules/finance/finance.module';
import { FollowUpsModule } from './modules/follow-ups/follow-ups.module';
import { ReportingModule } from './modules/reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    // Shared foundation (from Dev A)
    AuthModule,
    UsersModule,
    // Dev B modules
    ServicesModule,
    PackagesModule,
    SchedulingModule,
    FinanceModule,
    FollowUpsModule,
    ReportingModule,
  ],
})
export class AppModule {}
