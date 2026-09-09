import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler.middleware';
import { PaymentStatus, PaymentMode, ProcurementStatus, NotificationCategory } from '@prisma/client';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';

export class PaymentService {
  async listPayments(filter: {
    farmerId?: string;
    centreId?: string;
    status?: PaymentStatus;
  }) {
    const where: any = {};
    if (filter.farmerId) where.farmerId = filter.farmerId;
    if (filter.centreId) where.centreId = filter.centreId;
    if (filter.status) where.status = filter.status;

    return await prisma.payment.findMany({
      where,
      include: {
        procurement: {
          include: { commodity: true },
        },
        centre: true,
        farmer: { include: { farmerProfile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async disbursePayment(data: {
    paymentId: string;
    managerUserId: string;
    paymentMode: PaymentMode;
    idempotencyKey?: string;
  }) {
    const { paymentId, managerUserId, paymentMode, idempotencyKey } = data;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await prisma.payment.findUnique({
        where: { idempotencyKey },
        include: { procurement: true, farmer: true },
      });
      if (existing) {
        return existing;
      }
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        procurement: { include: { commodity: true } },
        farmer: { include: { farmerProfile: true } },
        centre: true,
      },
    });

    if (!payment) {
      throw new AppError('Payment record not found', 404, 'NOT_FOUND');
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      throw new AppError('Payment has already been successfully disbursed', 400, 'ALREADY_PAID');
    }

    // Generate simulated banking transaction reference (e.g. DBT-MH-2026-XXXX)
    const modePrefix = paymentMode === PaymentMode.DIRECT_BENEFIT_TRANSFER ? 'DBT' : paymentMode === PaymentMode.UPI ? 'UPI' : 'NEFT';
    const txRef = `${modePrefix}-MH-2026-${Date.now().toString().slice(-7)}`;

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.SUCCESS,
          paymentMode,
          transactionReference: txRef,
          paidAt: new Date(),
          idempotencyKey: idempotencyKey || null,
        },
      });

      // Update linked procurement status to PAID
      await tx.procurementRecord.update({
        where: { id: payment.procurementId },
        data: { status: ProcurementStatus.PAID },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: managerUserId,
          userRole: 'CENTRE_MANAGER',
          action: 'PAYMENT_DISBURSED',
          resourceType: 'PAYMENT',
          resourceId: payment.id,
          metadata: JSON.stringify({
            amount: payment.amount,
            txRef,
            farmerId: payment.farmerId,
            mode: paymentMode,
          }),
        },
      });

      return updated;
    });

    // Notify farmer of credited funds
    await notificationService.sendNotification({
      userId: payment.farmerId,
      title: `Payment Disbursed: ₹${payment.amount.toLocaleString('en-IN')}`,
      body: `Your payment of ₹${payment.amount.toLocaleString('en-IN')} for ${payment.procurement.commodity.name} has been processed via ${paymentMode}. Reference: ${txRef}.`,
      category: NotificationCategory.PAYMENT,
      actionUrl: `/procurements`,
    });

    return {
      ...updatedPayment,
      procurement: payment.procurement,
    };
  }

  async generatePaymentReportCsv(centreId?: string): Promise<string> {
    const where: any = {};
    if (centreId) where.centreId = centreId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        farmer: { include: { farmerProfile: true } },
        procurement: { include: { commodity: true } },
        centre: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Payment ID',
      'Transaction Ref',
      'Farmer Name',
      'Farmer Phone',
      'Centre Name',
      'Commodity',
      'Amount (INR)',
      'Payment Mode',
      'Status',
      'Disbursed Date',
    ];

    const rows = payments.map((p) => [
      p.id,
      p.transactionReference || 'N/A',
      `"${p.farmer.farmerProfile?.fullName || 'Farmer'}"`,
      p.farmer.phone,
      `"${p.centre.name}"`,
      `"${p.procurement.commodity.name}"`,
      p.amount,
      p.paymentMode,
      p.status,
      p.paidAt ? p.paidAt.toISOString() : 'Pending',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const paymentService = new PaymentService();
