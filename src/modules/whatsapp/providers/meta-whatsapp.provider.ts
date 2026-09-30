import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WhatsAppProvider,
  WhatsAppSendRequest,
  WhatsAppSendResult,
} from './whatsapp-provider';

/**
 * Meta Cloud API stub. Requires WHATSAPP_META_TOKEN + WHATSAPP_META_PHONE_NUMBER_ID.
 * Until credentials are set, returns FAILED rather than fabricating SENT.
 */
@Injectable()
export class MetaWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'meta';
  private readonly logger = new Logger(MetaWhatsAppProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(request: WhatsAppSendRequest): Promise<WhatsAppSendResult> {
    const token = this.config.get<string>('WHATSAPP_META_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_META_PHONE_NUMBER_ID');

    if (!token || !phoneNumberId) {
      return {
        providerMessageId: null,
        status: 'FAILED',
        errorMessage: 'WHATSAPP_META_TOKEN or WHATSAPP_META_PHONE_NUMBER_ID is not configured',
      };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
      const payload = request.templateName
        ? {
            messaging_product: 'whatsapp',
            to: request.to.replace(/\D/g, ''),
            type: 'template',
            template: {
              name: request.templateName,
              language: { code: 'ar' },
            },
          }
        : {
            messaging_product: 'whatsapp',
            to: request.to.replace(/\D/g, ''),
            type: 'text',
            text: { body: request.body },
          };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        messages?: Array<{ id: string }>;
        error?: { message?: string };
      };

      if (!res.ok) {
        return {
          providerMessageId: null,
          status: 'FAILED',
          errorMessage: data.error?.message || `Meta API ${res.status}`,
        };
      }

      return {
        providerMessageId: data.messages?.[0]?.id ?? null,
        status: 'SENT',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`Meta send failed: ${message}`);
      return {
        providerMessageId: null,
        status: 'FAILED',
        errorMessage: message,
      };
    }
  }
}
