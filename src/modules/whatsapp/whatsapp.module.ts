import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsAppLog } from '../follow-ups/whatsapp-log.entity';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsAppLog, Patient, Doctor]),
  ],
  providers: [WhatsappService],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
