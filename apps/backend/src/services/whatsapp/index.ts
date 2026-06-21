import type { WhatsAppProvider } from './provider.js';
import { MockWhatsAppProvider } from './mock-provider.js';
import { env } from '../../config/env.js';

let providerInstance: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (providerInstance) return providerInstance;
  
  // Real implementation is on hold, always use mock for now
  if (env.WHATSAPP_ENABLED && env.WHATSAPP_API_URL) {
    // Return real provider here when implemented
    providerInstance = new MockWhatsAppProvider();
  } else {
    providerInstance = new MockWhatsAppProvider();
  }
  
  return providerInstance;
}
