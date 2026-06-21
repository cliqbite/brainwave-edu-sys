import type { SendWhatsAppPayload, SendWhatsAppResult, WhatsAppProvider } from './provider.js';
import { logger } from '../../config/logger.js';

export class MockWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(payload: SendWhatsAppPayload): Promise<SendWhatsAppResult> {
    logger.info({ payload }, 'MockWhatsAppProvider: Sending message');
    
    // Simulate 200-500ms delay
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Simulate 95% success rate
    if (Math.random() > 0.05) {
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      };
    }
    
    return {
      success: false,
      error: 'Simulated mock error',
    };
  }
}
