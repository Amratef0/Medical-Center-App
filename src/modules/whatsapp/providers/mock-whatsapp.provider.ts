import { Injectable, Logger } from '@nestjs/common';
import {
  WhatsAppProvider,
  WhatsAppSendRequest,
  WhatsAppSendResult,
} from './whatsapp-provider';

/** Local/dev default. Never marks a row as SENT — only MOCK. */
@Injectable()
export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'mock';
  private readonly logger = new Logger(MockWhatsAppProvider.name);

  async send(request: WhatsAppSendRequest): Promise<WhatsAppSendResult> {
    this.logger.log(
      `[mock] would send to ${request.to}: ${request.body.slice(0, 120)}`,
    );
    return {
      providerMessageId: null,
      status: 'MOCK',
    };
  }
}
