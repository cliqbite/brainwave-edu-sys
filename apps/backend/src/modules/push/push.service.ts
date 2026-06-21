import prisma from '../../config/database.js';
import { ValidationError } from '../../utils/errors.js';
import { enqueuePushNotification } from '../../services/queue/queue.service.js';
import type { SubscribeInput, SendPushInput } from './push.validator.js';

export async function subscribe(userId: number, data: SubscribeInput, userAgent?: string) {
  const existing = await prisma.pushSubscription.findFirst({
    where: { userId, endpoint: data.endpoint },
  });

  if (existing) {
    return prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent,
        isActive: true,
      },
    });
  }

  return prisma.pushSubscription.create({
    data: {
      userId,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent,
      isActive: true,
    },
  });
}

export async function unsubscribe(userId: number, endpoint: string) {
  const existing = await prisma.pushSubscription.findFirst({
    where: { userId, endpoint },
  });

  if (existing) {
    await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }

  return true;
}

export async function send(data: SendPushInput, createdById: number) {
  let userIds: number[] = [];

  if (data.recipientType === 'SINGLE' || data.recipientType === 'MULTIPLE') {
    if (!data.userIds || data.userIds.length === 0) throw new ValidationError('userIds required');
    userIds = data.userIds;
  } else if (data.recipientType === 'GROUP') {
    if (!data.groupIds || data.groupIds.length === 0) throw new ValidationError('groupIds required');
    const userGroups = await prisma.userGroup.findMany({
      where: { groupId: { in: data.groupIds } },
      select: { userId: true },
    });
    userIds = Array.from(new Set(userGroups.map(ug => ug.userId)));
  } else if (data.recipientType === 'ALL') {
    const users = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true } });
    userIds = users.map(u => u.id);
  }

  if (userIds.length === 0) throw new ValidationError('No valid users found to send push');

  const pushNotif = await prisma.pushNotification.create({
    data: {
      title: data.title,
      body: data.body,
      recipientType: data.recipientType as any,
      createdById,
    },
  });

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds }, isActive: true },
  });

  if (userIds.length > 0) {
    await prisma.pushNotificationRecipient.createMany({
      data: userIds.map(uId => {
        const sub = subscriptions.find(s => s.userId === uId);
        return {
          notificationId: pushNotif.id,
          userId: uId,
          subscriptionId: sub?.id ?? null,
          status: 'SENT',
        };
      }),
    });
    await enqueuePushNotification(pushNotif.id);
  }

  return { notificationId: pushNotif.id, enqueued: subscriptions.length };
}

export async function getSubscriptions(userId: number) {
  return prisma.pushSubscription.findMany({
    where: { userId, isActive: true },
    select: { id: true, endpoint: true, userAgent: true, createdAt: true },
  });
}

export async function getUserNotifications(userId: number, limit = 10) {
  const recipients = await prisma.pushNotificationRecipient.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      notification: {
        select: {
          title: true,
          body: true,
          url: true,
          createdAt: true,
        }
      }
    }
  });

  return recipients;
}

export async function markAsReadInApp(recipientId: number, userId: number) {
  return prisma.pushNotificationRecipient.update({
    where: { id: recipientId, userId },
    data: { inAppRead: true },
  });
}

export async function markAsReadPush(recipientId: number, userId: number) {
  return prisma.pushNotificationRecipient.update({
    where: { id: recipientId, userId },
    data: { pushRead: true },
  });
}

export async function markAllAsReadInApp(userId: number) {
  return prisma.pushNotificationRecipient.updateMany({
    where: { userId, inAppRead: false },
    data: { inAppRead: true },
  });
}
