import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsAppLog } from '../follow-ups/whatsapp-log.entity';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { WhatsAppTemplate } from './whatsapp-template.entity';
import { WhatsAppFlow } from './whatsapp-flow.entity';
import { WHATSAPP_PROVIDER } from './providers/whatsapp-provider';
import { MockWhatsAppProvider } from './providers/mock-whatsapp.provider';
import { MetaWhatsAppProvider } from './providers/meta-whatsapp.provider';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      WhatsAppLog,
      Patient,
      Doctor,
      WhatsAppTemplate,
      WhatsAppFlow,
    ]),
  ],
  providers: [
    WhatsappService,
    MockWhatsAppProvider,
    MetaWhatsAppProvider,
    {
      provide: WHATSAPP_PROVIDER,
      inject: [ConfigService, MockWhatsAppProvider, MetaWhatsAppProvider],
      useFactory: (
        config: ConfigService,
        mock: MockWhatsAppProvider,
        meta: MetaWhatsAppProvider,
      ) => {
        const driver = (config.get<string>('WHATSAPP_PROVIDER') || 'mock').toLowerCase();
        if (driver === 'meta') return meta;
        return mock;
      },
    },
  ],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
