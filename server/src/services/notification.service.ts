import { NotificationCategory } from '@prisma/client';
import { prisma } from '../prisma/client';
import { logger } from '../utils/logger';
import { sseManager } from '../utils/sse';

export interface SmsProvider {
  sendSms(to: string, message: string): Promise<boolean>;
}

export interface EmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

export class MockSmsProvider implements SmsProvider {
  async sendSms(to: string, message: string): Promise<boolean> {
    logger.info(`[MOCK SMS GATEWAY] To: ${to} | Message: "${message}"`);
    return true;
  }
}

export class MockEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    logger.info(`[MOCK EMAIL GATEWAY] To: ${to} | Subject: "${subject}" | Content: "${body.substring(0, 80)}..."`);
    return true;
  }
}

class NotificationService {
  private smsProvider: SmsProvider = new MockSmsProvider();
  private emailProvider: EmailProvider = new MockEmailProvider();

  public setSmsProvider(provider: SmsProvider) {
    this.smsProvider = provider;
  }

  public setEmailProvider(provider: EmailProvider) {
    this.emailProvider = provider;
  }

  async sendNotification(params: {
    userId: string;
    title: string;
    body: string;
    category: NotificationCategory;
    actionUrl?: string;
  }) {
    const { userId, title, body, category, actionUrl } = params;

    // 1. Fetch user & preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPref: true, farmerProfile: true },
    });

    if (!user) return null;

    const prefs = user.notificationPref || {
      inAppEnabled: true,
      smsEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
    };

    let createdNotification = null;

    // In-App Notification
    if (prefs.inAppEnabled) {
      createdNotification = await prisma.notification.create({
        data: {
          userId,
          title,
          body,
          category,
          actionUrl,
        },
      });

      // Stream real-time notification via SSE
      sseManager.broadcastGlobal('NOTIFICATION', {
        userId,
        notification: createdNotification,
      });
    }

    // Simulated / real SMS
    if (prefs.smsEnabled && user.phone) {
      await this.smsProvider.sendSms(user.phone, `${title}: ${body}`);
    }

    // Simulated / real Email
    if (prefs.emailEnabled && user.email) {
      await this.emailProvider.sendEmail(user.email, title, body);
    }

    return createdNotification;
  }

  async notifyTargetedFarmersForIncident(centreId: string, title: string, body: string) {
    // Find all farmers with active/upcoming bookings at this centre
    const activeBookings = await prisma.booking.findMany({
      where: {
        centreId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      },
      select: { farmerId: true },
      distinct: ['farmerId'],
    });

    const results = [];
    for (const b of activeBookings) {
      const notif = await this.sendNotification({
        userId: b.farmerId,
        title,
        body,
        category: NotificationCategory.INCIDENT,
      });
      results.push(notif);
    }

    // Also broadcast SSE to the centre
    sseManager.broadcastToCentre(centreId, 'CENTRE_INCIDENT', {
      centreId,
      title,
      body,
    });

    return results;
  }
}

export const notificationService = new NotificationService();
