import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../sessions/session.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Room } from '../rooms/room.entity';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CapacityService } from './capacity.service';
import { CapacityController } from './capacity.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Doctor, Room]),
    SettingsModule,
    NotificationsModule,
  ],
  controllers: [CapacityController],
  providers: [CapacityService],
  exports: [CapacityService],
})
export class CapacityModule {}
