import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    centreId: z.string().uuid(),
    commodityId: z.string().uuid(),
    slotId: z.string().uuid(),
    estimatedQuantity: z.number().positive('Estimated quantity must be greater than 0'),
  }),
});

export const getSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { centreId, commodityId, date } = req.query;
    const result = await bookingService.getAvailableSlots(
      centreId as string,
      commodityId as string,
      date as string
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const createBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const idempotencyKey = req.header('Idempotency-Key');
    const result = await bookingService.createBooking({
      farmerId: req.user!.userId,
      ...req.body,
      idempotencyKey,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getMyBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const isStaff = req.user!.role !== 'FARMER';
    if (isStaff) {
      const assignedCentre = req.user!.centreIds?.[0];
      const centreId = (req.query.centreId as string) || assignedCentre;
      const result = await bookingService.getCentreBookings(centreId);
      return res.status(200).json({ success: true, data: result });
    }
    const result = await bookingService.getFarmerBookings(req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await bookingService.cancelBooking(
      req.params.id,
      req.user!.userId,
      req.body.reason
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const rescheduleBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await bookingService.rescheduleBooking(
      req.params.id,
      req.user!.userId,
      req.body.newSlotId
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
