// ============================================================
// Brainwave EduSys - Push Notification Processor
// Processes queued push notifications, sends via web-push
// ============================================================

import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import webpush from 'web-push';

/**
 * Process a push notification by sending to all recipient subscriptions.
 */
export async function processPushNotification(
  notificationId: number,
  prisma: PrismaClient,
  logger: Logger
): Promise<void> {
  // Initialize VAPID if not already set
  const vapidPublicKey = process.env['VAPID_PUBLIC_KEY'];
  const vapidPrivateKey = process.env['VAPID_PRIVATE_KEY'];
  const vapidEmail = process.env['VAPID_EMAIL'] ?? 'mailto:admin@brainwave.edu';

  if (!vapidPublicKey || !vapidPrivateKey) {
    logger.warn({ notificationId }, 'VAPID keys not configured, skipping push notification');
    return;
  }

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  const notification = await prisma.pushNotification.findUnique({
    where: { id: notificationId },
    include: {
      recipients: {
        include: {
          subscription: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!notification) {
    logger.error({ notificationId }, 'Push notification not found');
    return;
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (const recipient of notification.recipients) {
    const subscription = recipient.subscription;

    if (!subscription || !subscription.isActive) {
      logger.debug({ subscriptionId: subscription?.id }, 'Skipping inactive or missing subscription');
      continue;
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon ?? '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: notification.url,
      data: { ...((notification.data as object) || {}), recipientId: recipient.id },
      timestamp: Date.now(),
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload
      );

      await prisma.pushNotificationRecipient.update({
        where: { id: recipient.id },
        data: { status: 'SENT' },
      });

      totalSent++;
      logger.debug({ userId: recipient.userId, subscriptionId: subscription.id }, 'Push sent');
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle 410 Gone - subscription no longer valid
      if (statusCode === 410 || statusCode === 404) {
        logger.info({ subscriptionId: subscription.id }, 'Subscription expired, marking inactive');
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { isActive: false },
        });
      }

      await prisma.pushNotificationRecipient.update({
        where: { id: recipient.id },
        data: { status: 'FAILED', errorMessage },
      });

      totalFailed++;
      logger.error(
        { userId: recipient.userId, subscriptionId: subscription.id, statusCode, error: errorMessage },
        'Push notification failed'
      );
    }
  }

  // Update notification totals
  await prisma.pushNotification.update({
    where: { id: notificationId },
    data: { totalSent, totalFailed },
  });

  logger.info(
    { notificationId, totalSent, totalFailed, total: notification.recipients.length },
    'Push notification processing completed'
  );
}
