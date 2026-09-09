import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler.middleware';
import { BookingStatus, QueueStatus, TokenType, NotificationCategory } from '@prisma/client';
import { generateNumericOtp, hashValue, signQrToken } from '../utils/crypto';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';
import { sseManager } from '../utils/sse';

export function parseSlotDateTime(slotDate: string, startTime: string): Date | null {
  try {
    if (!slotDate || !startTime) return null;
    const dateMatch = slotDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch) return null;
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const day = parseInt(dateMatch[3], 10);

    const timeMatch = startTime.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    if (!timeMatch) return null;

    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const meridiem = timeMatch[3]?.toUpperCase();

    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }

    const d = new Date(year, month, day, hours, minutes, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export class BookingService {
  async getAvailableSlots(centreId: string, commodityId: string, dateStr: string) {
    // Check centre status
    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      include: {
        incidents: {
          where: { status: { in: ['ACTIVE', 'INVESTIGATING'] }, pauseBookings: true },
        },
      },
    });

    if (!centre) {
      throw new AppError('Procurement centre not found', 404, 'CENTRE_NOT_FOUND');
    }

    const hasActiveOutage = centre.incidents.length > 0 || centre.operationalStatus === 'TEMPORARILY_CLOSED';

    const slots = await prisma.slot.findMany({
      where: {
        centreId,
        commodityId,
        slotDate: dateStr,
      },
      orderBy: { startTime: 'asc' },
    });

    return {
      centre: {
        id: centre.id,
        name: centre.name,
        operationalStatus: centre.operationalStatus,
        hasActiveOutage,
        outageNotice: centre.incidents[0]?.impactStatement || centre.statusNotice,
      },
      slots: slots.map((s) => ({
        id: s.id,
        slotDate: s.slotDate,
        startTime: s.startTime,
        endTime: s.endTime,
        maxCapacity: s.maxCapacity,
        bookedCapacity: s.bookedCapacity,
        remainingCapacity: Math.max(0, s.maxCapacity - s.bookedCapacity),
        isAvailable: !hasActiveOutage && !s.isLocked && s.bookedCapacity < s.maxCapacity,
      })),
    };
  }

  async createBooking(data: {
    farmerId: string;
    centreId: string;
    commodityId: string;
    slotId: string;
    estimatedQuantity: number;
    idempotencyKey?: string;
  }) {
    const { farmerId, centreId, commodityId, slotId, estimatedQuantity, idempotencyKey } = data;

    // Check idempotency
    if (idempotencyKey) {
      const existing = await prisma.booking.findUnique({
        where: { idempotencyKey },
        include: { slot: true, centre: true, commodity: true, verificationTokens: true },
      });
      if (existing) {
        return existing;
      }
    }

    // Check Centre Status
    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      include: {
        incidents: { where: { status: { in: ['ACTIVE', 'INVESTIGATING'] }, pauseBookings: true } },
      },
    });

    if (!centre) {
      throw new AppError('Centre not found', 404, 'CENTRE_NOT_FOUND');
    }

    if (centre.operationalStatus === 'TEMPORARILY_CLOSED' || centre.incidents.length > 0) {
      const reason = centre.incidents[0]?.impactStatement || centre.statusNotice || 'Centre is temporarily not accepting bookings.';
      throw new AppError(`Booking unavailable: ${reason}`, 400, 'CENTRE_OUTAGE');
    }

    // Use a strict database transaction with concurrency safeguards
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Fetch slot with locking check
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw new AppError('Time slot not found', 404, 'SLOT_NOT_FOUND');
      }

      if (slot.isLocked || slot.bookedCapacity >= slot.maxCapacity) {
        throw new AppError('This time slot is completely full. Please choose another available slot.', 409, 'SLOT_FULL');
      }

      // Check for overlapping active booking by same farmer for same commodity
      const existingFarmerBooking = await tx.booking.findFirst({
        where: {
          farmerId,
          commodityId,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
        },
      });

      if (existingFarmerBooking) {
        throw new AppError('You already have an active procurement booking for this commodity.', 400, 'DUPLICATE_BOOKING');
      }

      // 2. Increment booked capacity
      await tx.slot.update({
        where: { id: slotId },
        data: { bookedCapacity: { increment: 1 } },
      });

      // 3. Generate unique booking reference
      const ref = `KS-${new Date().getFullYear()}-${centre.code.split('-')[1] || 'C'}-${Date.now().toString().slice(-5)}`;

      // 4. Create booking
      const newBooking = await tx.booking.create({
        data: {
          bookingReference: ref,
          farmerId,
          slotId,
          centreId,
          commodityId,
          estimatedQuantity,
          status: BookingStatus.CONFIRMED,
          idempotencyKey: idempotencyKey || null,
        },
        include: {
          centre: true,
          commodity: true,
          slot: true,
        },
      });

      // 5. Generate secure numeric OTP and signed QR token
      const otpCode = generateNumericOtp(6);
      const expiresAt = new Date(Date.now() + 24 * 3600 * 1000); // Valid for 24h

      const qrPayload = {
        bookingId: newBooking.id,
        farmerId,
        centreId,
        nonce: `nonce-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        expiresAt: expiresAt.getTime(),
      };
      const signedQr = signQrToken(qrPayload);

      // Save verification tokens in DB
      await tx.verificationToken.create({
        data: {
          tokenType: TokenType.COLLECTION_OTP,
          codeHash: hashValue(otpCode),
          displayCode: otpCode,
          bookingId: newBooking.id,
          farmerId,
          centreId,
          expiresAt,
          isUsed: false,
        },
      });

      await tx.verificationToken.create({
        data: {
          tokenType: TokenType.COLLECTION_QR,
          codeHash: hashValue(signedQr),
          displayCode: signedQr,
          bookingId: newBooking.id,
          farmerId,
          centreId,
          expiresAt,
          isUsed: false,
        },
      });

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          userId: farmerId,
          userRole: 'FARMER',
          action: 'SLOT_BOOKED',
          resourceType: 'BOOKING',
          resourceId: newBooking.id,
          metadata: JSON.stringify({
            reference: ref,
            centre: centre.name,
            slotDate: slot.slotDate,
            startTime: slot.startTime,
            quantity: estimatedQuantity,
          }),
        },
      });

      return {
        ...newBooking,
        otpCode,
        signedQr,
      };
    });

    // 7. Dispatch notifications
    await notificationService.sendNotification({
      userId: farmerId,
      title: 'Slot Booking Confirmed',
      body: `Your slot for ${booking.commodity.name} at ${booking.centre.name} on ${booking.slot.slotDate} (${booking.slot.startTime}) is confirmed. Reference: ${booking.bookingReference}`,
      category: NotificationCategory.SLOT,
      actionUrl: `/bookings`,
    });

    return booking;
  }

  async getFarmerBookings(farmerId: string) {
    const bookings = await prisma.booking.findMany({
      where: { farmerId },
      include: {
        centre: true,
        commodity: true,
        slot: true,
        queueEntry: true,
        procurementRecord: {
          include: { payment: true },
        },
        verificationTokens: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((b) => {
      const otpToken = b.verificationTokens.find((t) => t.tokenType === TokenType.COLLECTION_OTP && !t.isUsed);
      const qrToken = b.verificationTokens.find((t) => t.tokenType === TokenType.COLLECTION_QR && !t.isUsed);

      // Compute cancellation eligibility
      let isCancellable = false;
      let cancellationDeadline: string | null = null;
      let cancellationBlockedReason: string | null = null;

      if (b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.PENDING) {
        if (b.slot?.slotDate && b.slot?.startTime) {
          const slotDateTime = parseSlotDateTime(b.slot.slotDate, b.slot.startTime);
          if (slotDateTime) {
            const deadline = new Date(slotDateTime.getTime() - 2 * 60 * 60 * 1000);
            cancellationDeadline = deadline.toISOString();
            const now = new Date();
            if (now >= slotDateTime) {
              isCancellable = false;
              cancellationBlockedReason = 'Scheduled arrival slot time has already started or passed';
            } else if (now >= deadline) {
              isCancellable = false;
              const minsLeft = Math.max(0, Math.round((slotDateTime.getTime() - now.getTime()) / 60000));
              cancellationBlockedReason = `Locked: Within 2 hrs of arrival (${minsLeft}m remaining)`;
            } else {
              isCancellable = true;
            }
          } else {
            isCancellable = true;
          }
        } else {
          isCancellable = true;
        }
      } else {
        isCancellable = false;
        cancellationBlockedReason = `Booking is ${b.status.toLowerCase().replace('_', ' ')}`;
      }

      return {
        ...b,
        activeOtp: otpToken ? otpToken.displayCode : null,
        activeQr: qrToken ? qrToken.displayCode : null,
        isCancellable,
        cancellationDeadline,
        cancellationBlockedReason,
      };
    });
  }

  async getCentreBookings(centreId?: string) {
    const where: any = {};
    if (centreId) where.centreId = centreId;
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        farmer: { include: { farmerProfile: true } },
        centre: true,
        commodity: true,
        slot: true,
        queueEntry: true,
        procurementRecord: {
          include: { payment: true },
        },
        verificationTokens: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return bookings;
  }

  async cancelBooking(bookingId: string, farmerId: string, reason?: string) {
    const existing = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { slot: true, centre: true, commodity: true },
    });

    if (!existing) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    if (existing.farmerId !== farmerId) {
      throw new AppError('Unauthorized: You do not own this booking', 403, 'FORBIDDEN');
    }

    if (existing.status === BookingStatus.CANCELLED) {
      throw new AppError('Booking is already cancelled', 400, 'ALREADY_CANCELLED');
    }

    if (existing.status === BookingStatus.CHECKED_IN) {
      throw new AppError('Cannot cancel booking: You have already checked in at the procurement centre.', 400, 'ALREADY_CHECKED_IN');
    }

    if (existing.status === BookingStatus.COMPLETED) {
      throw new AppError('Cannot cancel booking: Harvest procurement has already been completed.', 400, 'ALREADY_COMPLETED');
    }

    if (existing.status !== BookingStatus.CONFIRMED && existing.status !== BookingStatus.PENDING) {
      throw new AppError(`Cannot cancel booking with current status: ${existing.status}`, 400, 'INVALID_STATUS');
    }

    // Time-based 2-hour cut-off validation
    if (existing.slot?.slotDate && existing.slot?.startTime) {
      const slotDateTime = parseSlotDateTime(existing.slot.slotDate, existing.slot.startTime);
      if (slotDateTime) {
        const now = new Date();
        if (now >= slotDateTime) {
          throw new AppError(
            'Cannot cancel booking: Scheduled arrival slot time has already started or passed.',
            400,
            'SLOT_ALREADY_PASSED'
          );
        }

        const cutoffTime = new Date(slotDateTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours prior
        if (now >= cutoffTime) {
          const diffMinutes = Math.max(0, Math.round((slotDateTime.getTime() - now.getTime()) / 60000));
          throw new AppError(
            `Cancellation window closed: Bookings cannot be cancelled within 2 hours of arrival slot (starts in ${diffMinutes} minutes) to prevent mandi logistics disruption. Contact helpline 1800-180-1551.`,
            400,
            'CANCELLATION_CUTOFF_EXPIRED'
          );
        }
      }
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Decrement slot booked capacity
      await tx.slot.update({
        where: { id: existing.slotId },
        data: { bookedCapacity: { decrement: 1 } },
      });

      // Update booking status
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason || 'Cancelled by farmer',
        },
        include: {
          centre: true,
          commodity: true,
          slot: true,
        },
      });

      // Cancel queue entry if exists
      await tx.queueEntry.updateMany({
        where: { bookingId },
        data: { status: QueueStatus.CANCELLED },
      });

      // Mark verification tokens as used/invalid
      await tx.verificationToken.updateMany({
        where: { bookingId },
        data: { isUsed: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: farmerId,
          userRole: 'FARMER',
          action: 'SLOT_CANCELLED',
          resourceType: 'BOOKING',
          resourceId: bookingId,
          metadata: JSON.stringify({
            reason: reason || 'Cancelled by farmer',
            slotDate: existing.slot?.slotDate,
            startTime: existing.slot?.startTime,
          }),
        },
      });

      return updated;
    });

    // Send notification to farmer
    await notificationService.sendNotification({
      userId: farmerId,
      title: 'Slot Booking Cancelled',
      body: `Your procurement slot for ${updatedBooking.commodity.name} at ${updatedBooking.centre.name} scheduled for ${updatedBooking.slot.slotDate} (${updatedBooking.slot.startTime}) has been cancelled. Capacity has been released.`,
      category: NotificationCategory.SLOT,
      actionUrl: '/dashboard',
    });

    // Broadcast SSE to centre and global queue
    sseManager.broadcastToCentre(updatedBooking.centreId, 'QUEUE_UPDATE', {
      action: 'BOOKING_CANCELLED',
      bookingId: updatedBooking.id,
      slotId: updatedBooking.slotId,
    });
    sseManager.broadcastGlobal('QUEUE_UPDATE', {
      action: 'BOOKING_CANCELLED',
      bookingId: updatedBooking.id,
      centreId: updatedBooking.centreId,
    });

    return updatedBooking;
  }

  async rescheduleBooking(bookingId: string, farmerId: string, newSlotId: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { slot: true },
      });

      if (!booking) {
        throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
      }

      if (booking.farmerId !== farmerId) {
        throw new AppError('Unauthorized: You do not own this booking', 403, 'FORBIDDEN');
      }

      const targetSlot = await tx.slot.findUnique({
        where: { id: newSlotId },
      });

      if (!targetSlot || targetSlot.isLocked || targetSlot.bookedCapacity >= targetSlot.maxCapacity) {
        throw new AppError('Target slot is full or unavailable', 409, 'SLOT_UNAVAILABLE');
      }

      // Decrement old slot
      await tx.slot.update({
        where: { id: booking.slotId },
        data: { bookedCapacity: { decrement: 1 } },
      });

      // Increment new slot
      await tx.slot.update({
        where: { id: newSlotId },
        data: { bookedCapacity: { increment: 1 } },
      });

      // Update booking
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          slotId: newSlotId,
          status: BookingStatus.CONFIRMED,
        },
        include: { slot: true, centre: true, commodity: true },
      });

      await tx.auditLog.create({
        data: {
          userId: farmerId,
          userRole: 'FARMER',
          action: 'SLOT_RESCHEDULED',
          resourceType: 'BOOKING',
          resourceId: bookingId,
          metadata: JSON.stringify({ oldSlotId: booking.slotId, newSlotId }),
        },
      });

      return updated;
    });
  }
}

export const bookingService = new BookingService();
