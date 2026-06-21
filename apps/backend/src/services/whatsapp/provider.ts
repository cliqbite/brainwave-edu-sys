export interface SendWhatsAppPayload {
  to: string;
  message: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  sendMessage(payload: SendWhatsAppPayload): Promise<SendWhatsAppResult>;
}
