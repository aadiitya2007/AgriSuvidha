import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler.middleware';
import { verifyAndDecodeQrToken, hashValue } from '../utils/crypto';
import { TokenType, QueueStatus, BookingStatus } from '@prisma/client';
import { queueService } from './queue.service';
import { logger } from '../utils/logger';

export class VerificationService {
  async verifyQrOrOtp(params: {
    tokenType: 'QR' | 'OTP';
    tokenValue: string;
    operatorUserId: string;
    centreId: string;
  }) {
    const { tokenType, tokenValue, operatorUserId, centreId } = params;

    let targetBookingId: string | null = null;
    let verifiedTokenRecord: any = null;

    // Parse potential JSON or extract fields from tokenValue
    const cleanToken = tokenValue.trim();
    let checkOtp = cleanToken;
    let checkOrderNum = cleanToken;
    let checkOrderId = cleanToken;
    let checkBookingRef = cleanToken;
    let checkBookingId = cleanToken;

    try {
      const parsed = JSON.parse(cleanToken);
      if (parsed.pickupOtp) checkOtp = String(parsed.pickupOtp).trim();
      if (parsed.orderNumber) checkOrderNum = String(parsed.orderNumber).trim();
      if (parsed.orderId) checkOrderId = String(parsed.orderId).trim();
      if (parsed.bookingReference) checkBookingRef = String(parsed.bookingReference).trim();
      if (parsed.bookingId) checkBookingId = String(parsed.bookingId).trim();
      if (parsed.id) {
        checkBookingId = String(parsed.id).trim();
        checkOrderId = String(parsed.id).trim();
      }
    } catch (e) {
      // not JSON
    }

    // Check if token matches an Agri Store Order (Pickup OTP, Order Number, or Order ID)
    const orderMatch = await prisma.order.findFirst({
      where: {
        OR: [
          { pickupOtp: checkOtp },
          { orderNumber: { equals: checkOrderNum, mode: 'insensitive' } },
          { id: checkOrderId },
        ],
      },
      include: {
        farmer: { include: { farmerProfile: true } },
        items: { include: { product: true } },
        centre: true,
      },
    });

    if (orderMatch) {
      await prisma.order.update({
        where: { id: orderMatch.id },
        data: { status: 'FULFILLED' },
      });

      return {
        verified: true,
        isOrder: true,
        order: {
          id: orderMatch.id,
          orderNumber: orderMatch.orderNumber,
          farmerName: orderMatch.farmer.farmerProfile?.fullName || 'Farmer Partner',
          totalAmount: orderMatch.totalAmount,
          status: 'FULFILLED',
        },
        message: `Mandi Supply Order #${orderMatch.orderNumber} successfully verified & fulfilled!`,
      };
    }

    if (tokenType === 'QR') {
      // 1. Decrypt and verify HMAC cryptographic signature
      let qrResult = verifyAndDecodeQrToken(tokenValue);
      let bookingId = qrResult.payload?.bookingId;

      if (!qrResult.valid || !bookingId) {
        // Fallback: Check if tokenValue is JSON or raw booking reference or UUID
        if (!bookingId) {
          const bookingMatch = await prisma.booking.findFirst({
            where: {
              OR: [
                { id: checkBookingId },
                { bookingReference: { equals: checkBookingRef, mode: 'insensitive' } },
                { id: cleanToken },
                { bookingReference: { equals: cleanToken, mode: 'insensitive' } },
              ],
            },
          });
          if (bookingMatch) {
            bookingId = bookingMatch.id;
          }
        }
      }

      if (!bookingId) {
        throw new AppError('Invalid or unreadable QR code. Please enter the 6-digit OTP or booking reference manually.', 400, 'INVALID_QR');
      }

      targetBookingId = bookingId;

      // Find verification token in DB or create fallback record
      let tokenInDb = await prisma.verificationToken.findFirst({
        where: { bookingId },
      });

      if (!tokenInDb) {
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) throw new AppError('Booking not found for this QR code', 404, 'NOT_FOUND');
        tokenInDb = await prisma.verificationToken.create({
          data: {
            tokenType: TokenType.COLLECTION_QR,
            codeHash: hashValue(cleanToken),
            displayCode: cleanToken.slice(0, 8),
            bookingId,
            farmerId: booking.farmerId,
            centreId: booking.centreId,
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
            isUsed: false,
          },
        });
      }

      // If already redeemed, return existing queue entry gracefully
      if (tokenInDb.isUsed) {
        const existingQueue = await prisma.queueEntry.findUnique({
          where: { bookingId },
        });
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { farmer: { include: { farmerProfile: true } }, commodity: true },
        });
        if (booking && existingQueue) {
          return {
            verified: true,
            alreadyCheckedIn: true,
            booking: {
              id: booking.id,
              reference: booking.bookingReference,
              farmerName: booking.farmer.farmerProfile?.fullName,
              farmerPhone: booking.farmer.phone,
              commodityName: booking.commodity.name,
              estimatedQuantity: booking.estimatedQuantity,
            },
            queueToken: existingQueue.tokenDisplay,
            message: `Farmer already checked in. Active Token: ${existingQueue.tokenDisplay}`,
          };
        }
      }

      verifiedTokenRecord = tokenInDb;
    } else {
      // OTP or Booking Reference Verification
      const hashedOtp = hashValue(checkOtp);

      let tokenInDb = await prisma.verificationToken.findFirst({
        where: {
          codeHash: hashedOtp,
          tokenType: TokenType.COLLECTION_OTP,
          centreId,
        },
      });

      // Also check bookingReference or ID
      if (!tokenInDb) {
        const bookingMatch = await prisma.booking.findFirst({
          where: {
            OR: [
              { bookingReference: { equals: checkBookingRef, mode: 'insensitive' } },
              { id: checkBookingId },
              { bookingReference: { equals: cleanToken, mode: 'insensitive' } },
              { id: cleanToken },
            ],
            centreId,
          },
        });

        if (bookingMatch) {
          targetBookingId = bookingMatch.id;
          tokenInDb = await prisma.verificationToken.findFirst({
            where: { bookingId: bookingMatch.id },
          });

          if (!tokenInDb) {
            tokenInDb = await prisma.verificationToken.create({
              data: {
                tokenType: TokenType.COLLECTION_OTP,
                codeHash: hashedOtp,
                displayCode: cleanToken,
                bookingId: bookingMatch.id,
                farmerId: bookingMatch.farmerId,
                centreId,
                expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
                isUsed: false,
              },
            });
          }
        }
      }

      if (!tokenInDb) {
        // Universal demo OTP '123456'
        if (cleanToken === '123456' || checkOtp === '123456') {
          const pendingBooking = await prisma.booking.findFirst({
            where: {
              centreId,
              status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.PENDING] },
            },
            orderBy: { createdAt: 'desc' },
          });

          if (pendingBooking) {
            targetBookingId = pendingBooking.id;
            tokenInDb = await prisma.verificationToken.findFirst({
              where: { bookingId: pendingBooking.id },
            });
            if (!tokenInDb) {
              tokenInDb = await prisma.verificationToken.create({
                data: {
                  tokenType: TokenType.COLLECTION_OTP,
                  codeHash: hashValue('123456'),
                  displayCode: '123456',
                  bookingId: pendingBooking.id,
                  farmerId: pendingBooking.farmerId,
                  centreId,
                  expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
                  isUsed: false,
                },
              });
            }
          }
        }
      }

      if (!tokenInDb) {
        throw new AppError('Invalid OTP code or booking reference for this centre. Please check and try again.', 400, 'INVALID_OTP');
      }

      if (tokenInDb.isUsed) {
        const existingQueue = await prisma.queueEntry.findUnique({
          where: { bookingId: tokenInDb.bookingId },
        });
        const booking = await prisma.booking.findUnique({
          where: { id: tokenInDb.bookingId },
          include: { farmer: { include: { farmerProfile: true } }, commodity: true },
        });
        if (booking && existingQueue) {
          return {
            verified: true,
            alreadyCheckedIn: true,
            booking: {
              id: booking.id,
              reference: booking.bookingReference,
              farmerName: booking.farmer.farmerProfile?.fullName,
              farmerPhone: booking.farmer.phone,
              commodityName: booking.commodity.name,
              estimatedQuantity: booking.estimatedQuantity,
            },
            queueToken: existingQueue.tokenDisplay,
            message: `Farmer already checked in. Active Token: ${existingQueue.tokenDisplay}`,
          };
        }
      }

      targetBookingId = tokenInDb.bookingId;
      verifiedTokenRecord = tokenInDb;
    }

    // Mark token as used and check in farmer
    return await prisma.$transaction(async (tx) => {
      await tx.verificationToken.update({
        where: { id: verifiedTokenRecord.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
          usedByUserId: operatorUserId,
        },
      });

      // Fetch booking details
      const booking = await tx.booking.findUnique({
        where: { id: targetBookingId! },
        include: {
          farmer: { include: { farmerProfile: true } },
          commodity: true,
          centre: true,
        },
      });

      if (!booking) {
        throw new AppError('Associated booking record not found', 404, 'NOT_FOUND');
      }

      // Log successful verification attempt
      await tx.auditLog.create({
        data: {
          userId: operatorUserId,
          userRole: 'CENTRE_OPERATOR',
          action: 'VERIFICATION_SUCCESS',
          resourceType: 'BOOKING',
          resourceId: booking.id,
          metadata: JSON.stringify({
            tokenType,
            farmerName: booking.farmer.farmerProfile?.fullName,
            bookingReference: booking.bookingReference,
            commodity: booking.commodity.name,
          }),
        },
      });

      // Auto check-in to queue if not already
      let queueEntry = await tx.queueEntry.findUnique({
        where: { bookingId: booking.id },
      });

      if (!queueEntry) {
        const lastToken = await tx.queueEntry.findFirst({
          where: { centreId },
          orderBy: { tokenNumber: 'desc' },
        });

        const nextTokenNum = (lastToken?.tokenNumber || 0) + 1;
        const commodityPrefix = booking.commodity.code.split('-')[0] || 'C';
        const centrePrefix = booking.centre.code.split('-')[1] || 'CTR';
        const tokenDisplay = `${centrePrefix}-${commodityPrefix}-${String(nextTokenNum).padStart(3, '0')}`;

        queueEntry = await tx.queueEntry.create({
          data: {
            centreId,
            bookingId: booking.id,
            farmerId: booking.farmerId,
            tokenNumber: nextTokenNum,
            tokenDisplay,
            status: QueueStatus.WAITING,
            peopleAhead: await tx.queueEntry.count({ where: { centreId, status: QueueStatus.WAITING } }),
            estimatedWaitMinutes: 15,
          },
        });
      }

      return {
        verified: true,
        booking: {
          id: booking.id,
          reference: booking.bookingReference,
          farmerName: booking.farmer.farmerProfile?.fullName,
          farmerPhone: booking.farmer.phone,
          commodityName: booking.commodity.name,
          estimatedQuantity: booking.estimatedQuantity,
        },
        queueToken: queueEntry?.tokenDisplay,
      };
    });
  }
}

export const verificationService = new VerificationService();
