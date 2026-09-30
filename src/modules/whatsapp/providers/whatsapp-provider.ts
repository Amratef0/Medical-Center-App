export interface WhatsAppSendResult {
  /** Provider-assigned id when a real provider accepts the message; null for mock. */
  providerMessageId: string | null;
  /** Honest status for the log row after this attempt. */
  status: 'MOCK' | 'QUEUED' | 'SENT' | 'FAILED';
  errorMessage?: string;
}

export interface WhatsAppSendRequest {
  to: string;
  body: string;
  templateName?: string;
  templateParams?: Record<string, string>;
}

export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');

export interface WhatsAppProvider {
  readonly name: string;
  send(request: WhatsAppSendRequest): Promise<WhatsAppSendResult>;
}
