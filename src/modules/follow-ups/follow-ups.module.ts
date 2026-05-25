import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpsService } from './follow-ups.service';
import { FollowUpsController } from './follow-ups.controller';
import { FollowUpTask } from './follow-up.entity';
import { WhatsAppLog } from './whatsapp-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUpTask, WhatsAppLog])],
  controllers: [FollowUpsController],
  providers: [FollowUpsService],
  exports: [FollowUpsService],
})
export class FollowUpsModule {}
