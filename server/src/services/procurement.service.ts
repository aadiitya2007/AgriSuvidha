import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler.middleware';
import { QualityGrade, ProcurementStatus, PaymentMode, PaymentStatus, NotificationCategory } from '@prisma/client';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';

export class ProcurementService {
  /**
   * Automatically calculates quality grade and deductions based on moisture & foreign matter standards
   */
  calculateGradeAndDeductions(params: {
    commodityCode: string;
    moisture: number;
    foreignMatter: number;
    mspPrice: number;
    submittedWeight: number;
  }) {
    const { moisture, foreignMatter, mspPrice, submittedWeight } = params;

    let qualityGrade: QualityGrade = QualityGrade.GRADE_A;
    let ratePerUnit = mspPrice;
    let deductions = 0;
    let deductionReason = '';

    if (moisture > 16.0 || foreignMatter > 3.0) {
      qualityGrade = QualityGrade.REJECTED;
      ratePerUnit = 0;
      deductionReason = 'Moisture or foreign matter exceeds maximum acceptable procurement limits.';
    } else if (moisture > 14.0 || foreignMatter > 1.8) {
      qualityGrade = QualityGrade.GRADE_C;
      ratePerUnit = Math.round(mspPrice * 0.92 * 100) / 100;
      deductions = Math.round(submittedWeight * (mspPrice - ratePerUnit));
      deductionReason = 'Grade C quality: Moisture 14-16% and higher dockage adjustment.';
    } else if (moisture > 12.0 || foreignMatter > 1.0) {
      qualityGrade = QualityGrade.GRADE_B;
      ratePerUnit = Math.round(mspPrice * 0.97 * 100) / 100;
      deductions = Math.round(submittedWeight * (mspPrice - ratePerUnit));
      deductionReason = 'Grade B quality: Slight moisture/dockage deduction from baseline MSP.';
    } else {
      qualityGrade = QualityGrade.GRADE_A;
      ratePerUnit = mspPrice;
      deductions = 0;
      deductionReason = 'Grade A: Premium dry grain matching FAQ specifications.';
    }

    const grossPayable = Math.round(submittedWeight * mspPrice * 100) / 100;
    const netPayable = qualityGrade === QualityGrade.REJECTED ? 0 : Math.round((grossPayable - deductions) * 100) / 100;

    return {
      qualityGrade,
      ratePerUnit,
      grossPayable,
      deductions,
      netPayable,
      deductionReason,
    };
  }

  async recordInspection(data: {
    bookingId: string;
    operatorUserId: string;
    submittedWeight: number;
    moistureContent: number;
    foreignMatterPercent: number;
    inspectionNotes?: string;
    lineItems?: Array<{
      bagBatchNumber: string;
      bagCount: number;
      grossWeightKg: number;
      tareWeightKg: number;
      netWeightKg: number;
    }>;
  }) {
    const { bookingId, operatorUserId, submittedWeight, moistureContent, foreignMatterPercent, inspectionNotes, lineItems } = data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        commodity: true,
        centre: true,
        farmer: { include: { farmerProfile: true } },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND');
    }

    const { qualityGrade, ratePerUnit, grossPayable, deductions, netPayable, deductionReason } = this.calculateGradeAndDeductions({
      commodityCode: booking.commodity.code,
      moisture: moistureContent,
      foreignMatter: foreignMatterPercent,
      mspPrice: booking.commodity.minMspPrice,
      submittedWeight,
    });

    const isAccepted = qualityGrade !== QualityGrade.REJECTED;
    const acceptedWeight = isAccepted ? submittedWeight : 0;
    const rejectedWeight = isAccepted ? 0 : submittedWeight;

    const receiptNumber = `REC-${new Date().getFullYear()}-${booking.centre.code.split('-')[1] || 'C'}-${Date.now().toString().slice(-5)}`;

    const record = await prisma.$transaction(async (tx) => {
      const proc = await tx.procurementRecord.create({
        data: {
          bookingId,
          centreId: booking.centreId,
          farmerId: booking.farmerId,
          commodityId: booking.commodityId,
          operatorId: operatorUserId,
          receiptNumber,
          submittedWeight,
          acceptedWeight,
          rejectedWeight,
          unit: booking.commodity.unit,
          qualityGrade,
          moistureContent,
          foreignMatterPercent,
          ratePerUnit,
          grossPayable,
          deductions,
          netPayable,
          deductionReason,
          status: isAccepted ? ProcurementStatus.UNDER_INSPECTION : ProcurementStatus.REJECTED,
          inspectionNotes,
          lineItems: lineItems && lineItems.length > 0 ? {
            create: lineItems.map((li) => ({
              bagBatchNumber: li.bagBatchNumber,
              bagCount: li.bagCount,
              grossWeightKg: li.grossWeightKg,
              tareWeightKg: li.tareWeightKg,
              netWeightKg: li.netWeightKg,
              sampleQualityGrade: qualityGrade,
            })),
          } : undefined,
        },
        include: {
          commodity: true,
          centre: true,
          farmer: { include: { farmerProfile: true } },
          lineItems: true,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: operatorUserId,
          userRole: 'CENTRE_OPERATOR',
          action: 'PROCUREMENT_INSPECTED',
          resourceType: 'PROCUREMENT_RECORD',
          resourceId: proc.id,
          metadata: JSON.stringify({
            receiptNumber,
            grade: qualityGrade,
            weight: submittedWeight,
            netPayable,
          }),
        },
      });

      return proc;
    });

    // Notify farmer
    await notificationService.sendNotification({
      userId: booking.farmerId,
      title: `Procurement Inspection Complete: ${qualityGrade}`,
      body: `Your ${submittedWeight} ${booking.commodity.unit} of ${booking.commodity.name} has been evaluated as ${qualityGrade}. Net payable: ₹${netPayable.toLocaleString('en-IN')}.`,
      category: NotificationCategory.PROCUREMENT,
      actionUrl: `/procurements`,
    });

    return record;
  }

  async managerDecision(params: {
    recordId: string;
    managerUserId: string;
    action: 'APPROVE' | 'REJECT';
    notes?: string;
  }) {
    const { recordId, managerUserId, action, notes } = params;

    const record = await prisma.procurementRecord.findUnique({
      where: { id: recordId },
      include: { booking: true, commodity: true, centre: true },
    });

    if (!record) {
      throw new AppError('Procurement record not found', 404, 'NOT_FOUND');
    }

    if (record.status !== ProcurementStatus.UNDER_INSPECTION) {
      throw new AppError(`Cannot make decision on record with status ${record.status}`, 400, 'INVALID_STATUS');
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.procurementRecord.update({
        where: { id: recordId },
        data: {
          managerId: managerUserId,
          status: action === 'APPROVE' ? ProcurementStatus.APPROVED : ProcurementStatus.REJECTED,
          inspectionNotes: notes ? `${record.inspectionNotes || ''} | Manager Note: ${notes}` : record.inspectionNotes,
        },
      });

      // If approved, automatically create pending payment entry
      if (action === 'APPROVE' && record.netPayable > 0) {
        await tx.payment.create({
          data: {
            procurementId: record.id,
            farmerId: record.farmerId,
            centreId: record.centreId,
            amount: record.netPayable,
            paymentMode: PaymentMode.DIRECT_BENEFIT_TRANSFER,
            status: PaymentStatus.PENDING,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: managerUserId,
          userRole: 'CENTRE_MANAGER',
          action: `PROCUREMENT_${action}D`,
          resourceType: 'PROCUREMENT_RECORD',
          resourceId: record.id,
          metadata: JSON.stringify({ action, notes }),
        },
      });

      return updated;
    });
  }

  async listRecords(filter: {
    farmerId?: string;
    centreId?: string;
    status?: ProcurementStatus;
    receiptNumber?: string;
  }) {
    const where: any = {};
    if (filter.farmerId) where.farmerId = filter.farmerId;
    if (filter.centreId) where.centreId = filter.centreId;
    if (filter.status) where.status = filter.status;
    if (filter.receiptNumber) where.receiptNumber = { contains: filter.receiptNumber, mode: 'insensitive' };

    return await prisma.procurementRecord.findMany({
      where,
      include: {
        commodity: true,
        centre: true,
        farmer: { include: { farmerProfile: true } },
        payment: true,
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecordById(recordId: string) {
    const record = await prisma.procurementRecord.findUnique({
      where: { id: recordId },
      include: {
        commodity: true,
        centre: true,
        farmer: { include: { farmerProfile: true } },
        payment: true,
        lineItems: true,
        operator: { include: { farmerProfile: true } },
        manager: { include: { farmerProfile: true } },
      },
    });

    if (!record) {
      throw new AppError('Procurement record not found', 404, 'NOT_FOUND');
    }

    return record;
  }
}

export const procurementService = new ProcurementService();
