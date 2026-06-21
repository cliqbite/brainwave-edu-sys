import prisma from '../../config/database.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { auditLog } from '../../middlewares/auditLogger.js';
import { buildPrismaQueryArgs, buildPaginationMeta } from '../../utils/pagination.js';
import { enqueueMessageCampaign, enqueuePushNotification } from '../../services/queue/queue.service.js';
import type { PaginationQuery, SendMessageRequest, SendMessageRequest as BroadcastMessageInput } from '@brainwave/shared';

export async function send(data: SendMessageRequest, createdById: number) {
  const users = await prisma.user.findMany({
    where: { id: { in: data.userIds }, deletedAt: null },
  });

  if (users.length === 0) throw new ValidationError('No valid users found');

  const campaign = await prisma.messageCampaign.create({
    data: {
      messageBody: data.messageBody,
      channel: data.channel,
      recipientType: data.recipientType,
      createdById,
      status: data.channel === 'PUSH' ? 'SENT' : 'PENDING',
      totalRecipients: users.length,
      sentCount: data.channel === 'PUSH' ? users.length : 0,
      completedAt: data.channel === 'PUSH' ? new Date() : null,
      messageRecipients: {
        create: users.map((u: any) => ({
          userId: u.id,
          whatsappNumber: u.whatsappNumber ?? u.phone,
        })),
      },
    },
  });

  if (data.channel === 'WHATSAPP' || data.channel === 'BOTH') {
    await enqueueMessageCampaign(campaign.id);
  }

  if (data.channel === 'PUSH' || data.channel === 'BOTH') {
    const pushNotif = await prisma.pushNotification.create({
      data: {
        title: 'New Message',
        body: data.messageBody,
        recipientType: data.recipientType,
        createdById,
      },
    });

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: users.map((u: any) => u.id) }, isActive: true },
    });

    if (users.length > 0) {
      await prisma.pushNotificationRecipient.createMany({
        data: users.map((u: any) => {
          const sub = subscriptions.find((s: any) => s.userId === u.id);
          return {
            notificationId: pushNotif.id,
            userId: u.id,
            subscriptionId: sub?.id ?? null,
            status: 'SENT',
          };
        }),
      });
      await enqueuePushNotification(pushNotif.id);
    }
  }

  auditLog({
    userId: createdById,
    action: 'CREATE',
    module: 'MESSAGES',
    targetType: 'MessageCampaign',
    targetId: campaign.id,
    newValues: { channel: data.channel, recipientType: data.recipientType, totalRecipients: users.length },
  });

  return { campaignId: campaign.uuid };
}

export async function broadcast(data: BroadcastMessageInput, createdById: number) {
  let userIds: number[] = [];

  if (data.recipientType === 'ALL') {
    const users = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true } });
    userIds = users.map((u: any) => u.id);
  } else if (data.recipientType === 'GROUP' && data.groupIds) {
    const userGroups = await prisma.userGroup.findMany({
      where: { groupId: { in: data.groupIds } },
      select: { userId: true },
    });
    userIds = Array.from(new Set(userGroups.map((ug: any) => ug.userId)));
  } else {
    throw new ValidationError('Invalid recipient type or missing groupIds');
  }

  if (userIds.length === 0) throw new ValidationError('No valid users found to broadcast');

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, whatsappNumber: true, phone: true },
  });

  const campaign = await prisma.messageCampaign.create({
    data: {
      title: data.title,
      messageBody: data.messageBody,
      channel: data.channel,
      recipientType: data.recipientType,
      createdById,
      status: data.channel === 'PUSH' ? 'SENT' : 'PENDING',
      totalRecipients: users.length,
      sentCount: data.channel === 'PUSH' ? users.length : 0,
      completedAt: data.channel === 'PUSH' ? new Date() : null,
      messageRecipients: {
        create: users.map((u: any) => ({
          userId: u.id,
          whatsappNumber: u.whatsappNumber ?? u.phone,
        })),
      },
    },
  });

  if (data.channel === 'WHATSAPP' || data.channel === 'BOTH') {
    await enqueueMessageCampaign(campaign.id);
  }

  if (data.channel === 'PUSH' || data.channel === 'BOTH') {
    const pushNotif = await prisma.pushNotification.create({
      data: {
        title: data.title ?? 'Broadcast',
        body: data.messageBody,
        recipientType: data.recipientType,
        createdById,
      },
    });

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: users.map((u: any) => u.id) }, isActive: true },
    });

    if (users.length > 0) {
      await prisma.pushNotificationRecipient.createMany({
        data: users.map((u: any) => {
          const sub = subscriptions.find((s: any) => s.userId === u.id);
          return {
            notificationId: pushNotif.id,
            userId: u.id,
            subscriptionId: sub?.id ?? null,
            status: 'SENT',
          };
        }),
      });
      await enqueuePushNotification(pushNotif.id);
    }
  }

  auditLog({
    userId: createdById,
    action: 'CREATE',
    module: 'MESSAGES',
    targetType: 'MessageCampaign',
    targetId: campaign.id,
    newValues: { channel: data.channel, recipientType: data.recipientType, totalRecipients: users.length },
  });

  return { campaignId: campaign.uuid };
}

export async function getCampaigns(query: PaginationQuery) {
  const { skip, take, orderBy } = buildPrismaQueryArgs(query);

  const [campaigns, total] = await Promise.all([
    prisma.messageCampaign.findMany({
      skip,
      take,
      orderBy,
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.messageCampaign.count(),
  ]);

  return {
    campaigns,
    meta: buildPaginationMeta(total, query.page, query.limit),
  };
}

export async function getCampaignById(id: number) {
  const campaign = await prisma.messageCampaign.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } } },
  });

  if (!campaign) throw new NotFoundError('Campaign not found');

  return campaign;
}

export async function getCampaignRecipients(campaignId: number, query: PaginationQuery) {
  const { skip, take, orderBy } = buildPrismaQueryArgs(query);

  const [recipients, total] = await Promise.all([
    prisma.messageRecipient.findMany({
      where: { campaignId },
      skip,
      take,
      orderBy,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.messageRecipient.count({ where: { campaignId } }),
  ]);

  return {
    recipients,
    meta: buildPaginationMeta(total, query.page, query.limit),
  };
}
