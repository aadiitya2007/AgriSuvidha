import { Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { PaymentStatus, PaymentMode } from '@prisma/client';

export const listPayments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const isFarmer = req.user!.role === 'FARMER';
    const filter: any = {
      status: req.query.status as PaymentStatus,
    };

    if (isFarmer) {
      filter.farmerId = req.user!.userId;
    } else if (req.query.centreId) {
      filter.centreId = req.query.centreId as string;
    }

    const result = await paymentService.listPayments(filter);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const disbursePayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const idempotencyKey = req.header('Idempotency-Key');
    const { paymentId, paymentMode } = req.body;

    const result = await paymentService.disbursePayment({
      paymentId,
      managerUserId: req.user!.userId,
      paymentMode: paymentMode || PaymentMode.DIRECT_BENEFIT_TRANSFER,
      idempotencyKey,
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const exportPaymentReportCsv = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const csv = await paymentService.generatePaymentReportCsv(req.query.centreId as string);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="krishisetu-payment-report-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};
