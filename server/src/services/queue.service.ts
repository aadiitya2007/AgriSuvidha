import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler.middleware';
import { QueueStatus, BookingStatus, NotificationCategory } from '@prisma/client';
import { CONSTANTS } from '../config/constants';
import { sseManager } from '../utils/sse';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';

export class QueueService {
  async getCentreQueue(centreId: string) {
    const entries = await prisma.queueEntry.findMany({
      where: {
        centreId,
        status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_INSPECTION] },
      },
      include: {
        farmer: {
          include: { farmerProfile: true },
        },
        booking: {
          include: { commodity: true },
        },
      },
      orderBy: [{ status: 'asc' }, { tokenNumber: 'asc' }],
    });

    const activeToken = entries.find((e) => e.status === QueueStatus.IN_INSPECTION || e.status === QueueStatus.CALLED);

    // Calculate dynamic people ahead and estimated wait times
    let waitingIndex = 0;
    const formattedEntries = entries.map((e) => {
      let peopleAhead = 0;
      let estimatedWaitMinutes = 0;

      if (e.status === QueueStatus.WAITING) {
        peopleAhead = waitingIndex;
        estimatedWaitMinutes = (waitingIndex + 1) * CONSTANTS.QUEUE.AVG_MINUTES_PER_FARMER;
        waitingIndex++;
      }

      return {
        id: e.id,
        tokenNumber: e.tokenNumber,
        tokenDisplay: e.tokenDisplay,
        status: e.status,
        peopleAhead,
        estimatedWaitMinutes,
        calledAt: e.calledAt,
        farmerName: e.farmer.farmerProfile?.fullName || 'Farmer',
        farmerPhone: e.farmer.phone,
        commodityName: e.booking.commodity.name,
        estimatedQuantity: e.booking.estimatedQuantity,
      };
    });

    return {
      centreId,
      activeToken: activeToken ? { tokenDisplay: activeToken.tokenDisplay, id: activeToken.id } : null,
      totalInQueue: entries.length,
      waitingCount: entries.filter((e) => e.status === QueueStatus.WAITING).length,
      entries: formattedEntries,
    };
  }

  async checkInFarmerToQueue(bookingId: string, centreId: string, operatorUserId: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { centre: true, commodity: true, farmer: { include: { farmerProfile: true } } },
      });

      if (!booking) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      if (booking.centreId !== centreId) {
        throw new AppError('This booking belongs to a different procurement centre', 400, 'CENTRE_MISMATCH');
      }

      // Check if already checked in
      const existingQueue = await tx.queueEntry.findUnique({
        where: { bookingId },
      });

      if (existingQueue) {
        return existingQueue;
      }

      // Find highest token for this centre today
      const lastToken = await tx.queueEntry.findFirst({
        where: { centreId },
        orderBy: { tokenNumber: 'desc' },
      });

      const nextTokenNum = (lastToken?.tokenNumber || 0) + 1;
      const commodityPrefix = booking.commodity.code.split('-')[0] || 'C';
      const centrePrefix = booking.centre.code.split('-')[1] || 'CTR';
      const tokenDisplay = `${centrePrefix}-${commodityPrefix}-${String(nextTokenNum).padStart(3, '0')}`;

      // Calculate queue count ahead
      const waitingAhead = await tx.queueEntry.count({
        where: { centreId, status: QueueStatus.WAITING },
      });

      const queueEntry = await tx.queueEntry.create({
        data: {
          centreId,
          bookingId,
          farmerId: booking.farmerId,
          tokenNumber: nextTokenNum,
          tokenDisplay,
          status: QueueStatus.WAITING,
          peopleAhead: waitingAhead,
          estimatedWaitMinutes: (waitingAhead + 1) * CONSTANTS.QUEUE.AVG_MINUTES_PER_FARMER,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CHECKED_IN },
      });

      await tx.auditLog.create({
        data: {
          userId: operatorUserId,
          userRole: 'CENTRE_OPERATOR',
          action: 'CHECK_IN_QUEUE',
          resourceType: 'QUEUE_ENTRY',
          resourceId: queueEntry.id,
          metadata: JSON.stringify({ tokenDisplay, farmerId: booking.farmerId }),
        },
      });

      return queueEntry;
    });
  }

  async callNextToken(centreId: string, operatorUserId: string) {
    const result = await prisma.$transaction(async (tx) => {
      // Complete or move previous called token to inspection
      const currentlyCalled = await tx.queueEntry.findFirst({
        where: { centreId, status: QueueStatus.CALLED },
      });

      if (currentlyCalled) {
        await tx.queueEntry.update({
          where: { id: currentlyCalled.id },
          data: { status: QueueStatus.IN_INSPECTION },
        });
      }

      // Find next waiting entry
      const nextEntry = await tx.queueEntry.findFirst({
        where: { centreId, status: QueueStatus.WAITING },
        orderBy: { tokenNumber: 'asc' },
        include: { farmer: true, booking: { include: { commodity: true } } },
      });

      if (!nextEntry) {
        throw new AppError('No waiting farmers in queue', 400, 'QUEUE_EMPTY');
      }

      const updated = await tx.queueEntry.update({
        where: { id: nextEntry.id },
        data: {
          status: QueueStatus.CALLED,
          calledAt: new Date(),
        },
        include: { farmer: true, booking: { include: { commodity: true } } },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: operatorUserId,
          userRole: 'CENTRE_OPERATOR',
          action: 'QUEUE_CALL_NEXT',
          resourceType: 'QUEUE_ENTRY',
          resourceId: updated.id,
          metadata: JSON.stringify({ tokenDisplay: updated.tokenDisplay }),
        },
      });

      return updated;
    });

    // Notify farmer their token is called
    await notificationService.sendNotification({
      userId: result.farmerId,
      title: `Token ${result.tokenDisplay} Called!`,
      body: `Your token ${result.tokenDisplay} is now called for inspection. Please bring your vehicle to Weighbridge Gate.`,
      category: NotificationCategory.QUEUE,
      actionUrl: `/queue`,
    });

    // Broadcast live SSE update
    sseManager.broadcastToCentre(centreId, 'QUEUE_UPDATE', {
      type: 'TOKEN_CALLED',
      calledToken: result.tokenDisplay,
      tokenNumber: result.tokenNumber,
      centreId,
    });

    return result;
  }

  async updateQueueStatus(entryId: string, status: QueueStatus, operatorUserId: string) {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { booking: true },
    });

    if (!entry) {
      throw new AppError('Queue entry not found', 404, 'NOT_FOUND');
    }

    const updated = await prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status,
        completedAt: status === QueueStatus.SERVED ? new Date() : undefined,
      },
    });

    if (status === QueueStatus.SERVED) {
      await prisma.booking.update({
        where: { id: entry.bookingId },
        data: { status: BookingStatus.COMPLETED },
      });
    }

    // Broadcast SSE update
    sseManager.broadcastToCentre(entry.centreId, 'QUEUE_UPDATE', {
      type: 'STATUS_CHANGED',
      entryId,
      status,
      centreId: entry.centreId,
    });

    return updated;
  }
}

export const queueService = new QueueService();
