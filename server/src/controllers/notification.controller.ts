import { Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const listNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const category = req.query.category as any;

    const where: any = { userId };
    if (category && category !== 'ALL') where.category = category;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId: req.user!.userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } else {
      await prisma.notification.update({
        where: { id, userId: req.user!.userId },
        data: { isRead: true, readAt: new Date() },
      });
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

export const getPreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId: req.user!.userId },
      });
    }

    res.status(200).json({ success: true, data: prefs });
  } catch (err) {
    next(err);
  }
};

export const updatePreferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { inAppEnabled, smsEnabled, emailEnabled, pushEnabled } = req.body;
    const updated = await prisma.notificationPreference.upsert({
      where: { userId: req.user!.userId },
      create: {
        userId: req.user!.userId,
        inAppEnabled,
        smsEnabled,
        emailEnabled,
        pushEnabled,
      },
      update: {
        inAppEnabled,
        smsEnabled,
        emailEnabled,
        pushEnabled,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};
