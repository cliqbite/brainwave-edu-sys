// ============================================================
// Brainwave EduSys - Message Campaign Processor
// Processes queued message campaigns, sends via WhatsApp provider
// ============================================================

import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';

/**
 * Process a message campaign by sending messages to all recipients.
 * Uses a mock WhatsApp provider since real integration is on hold.
 */
export async function processMessageCampaign(
  campaignId: number,
  prisma: PrismaClient,
  logger: Logger
): Promise<void> {
  const campaign = await prisma.messageCampaign.findUnique({
    where: { id: campaignId },
    include: {
      messageRecipients: {
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, name: true, whatsappNumber: true, phone: true } } },
      },
    },
  });

  if (!campaign) {
    logger.error({ campaignId }, 'Campaign not found');
    return;
  }

  // Update campaign status to PROCESSING
  await prisma.messageCampaign.update({
    where: { id: campaignId },
    data: { status: 'PROCESSING', startedAt: new Date() },
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const recipient of campaign.messageRecipients) {
    try {
      const phoneNumber = recipient.whatsappNumber ?? recipient.user.whatsappNumber ?? recipient.user.phone;

      if (!phoneNumber) {
        // No phone number available
        await prisma.messageRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', errorMessage: 'No phone/WhatsApp number available' },
        });

        await prisma.messageLog.create({
          data: {
            campaignId: campaign.id,
            recipientId: recipient.id,
            provider: 'mock',
            status: 'FAILED',
            error: 'No phone/WhatsApp number available',
          },
        });

        failedCount++;
        continue;
      }

      // Mock WhatsApp API call — simulates sending
      const result = await mockSendWhatsApp(phoneNumber, campaign.messageBody);

      if (result.success) {
        await prisma.messageRecipient.update({
          where: { id: recipient.id },
          data: { status: 'SENT', sentAt: new Date() },
        });

        await prisma.messageLog.create({
          data: {
            campaignId: campaign.id,
            recipientId: recipient.id,
            provider: 'mock',
            providerMessageId: result.messageId,
            status: 'SENT',
            requestPayload: { to: phoneNumber, message: campaign.messageBody } as any,
            responsePayload: result as any,
          },
        });

        sentCount++;
      } else {
        await prisma.messageRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED', errorMessage: result.error },
        });

        await prisma.messageLog.create({
          data: {
            campaignId: campaign.id,
            recipientId: recipient.id,
            provider: 'mock',
            status: 'FAILED',
            error: result.error,
            requestPayload: { to: phoneNumber, message: campaign.messageBody } as any,
          },
        });

        failedCount++;
      }

      logger.info(
        { campaignId, recipientId: recipient.id, phoneNumber, success: result.success },
        'Message processed'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ campaignId, recipientId: recipient.id, error: errorMessage }, 'Error processing recipient');

      await prisma.messageRecipient.update({
        where: { id: recipient.id },
        data: { status: 'FAILED', errorMessage },
      });

      failedCount++;
    }
  }

  // Determine final campaign status
  const totalRecipients = campaign.messageRecipients.length;
  let finalStatus: 'SENT' | 'FAILED' | 'PARTIAL_FAILED';

  if (failedCount === 0) {
    finalStatus = 'SENT';
  } else if (sentCount === 0) {
    finalStatus = 'FAILED';
  } else {
    finalStatus = 'PARTIAL_FAILED';
  }

  await prisma.messageCampaign.update({
    where: { id: campaignId },
    data: {
      status: finalStatus,
      sentCount: campaign.sentCount + sentCount,
      failedCount: campaign.failedCount + failedCount,
      completedAt: new Date(),
    },
  });

  logger.info(
    { campaignId, totalRecipients, sentCount, failedCount, finalStatus },
    'Campaign processing completed'
  );
}

/**
 * Mock WhatsApp API — returns success with a fake message ID.
 * Replace with real provider when WhatsApp integration is implemented.
 */
async function mockSendWhatsApp(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  // Simulate 95% success rate
  if (Math.random() > 0.05) {
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    };
  }

  return {
    success: false,
    error: 'Mock API: Simulated delivery failure',
  };
}
