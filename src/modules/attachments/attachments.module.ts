import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { Patient } from '../patients/patient.entity';
import { Attachment } from './attachment.entity';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { AttachmentsAccessService } from './attachments-access.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment, Patient]), StorageModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService, AttachmentsAccessService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
