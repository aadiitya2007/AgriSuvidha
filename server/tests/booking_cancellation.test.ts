import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { ensurePostgresRunning } from '../src/prisma/dbManager';
import { connectDatabase, prisma } from '../src/prisma/client';
import { parseSlotDateTime } from '../src/services/booking.service';
import { BookingStatus } from '@prisma/client';

describe('Booking Cancellation & 2-Hour Time Cut-off Rule Tests', () => {
  let farmerToken: string;
  let farmerId: string;
  let centreId: string;
  let commodityId: string;

  beforeAll(async () => {
    await ensurePostgresRunning();
    await connectDatabase();

    // Authenticate farmer
    const authRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+91 98230 11001', otp: '123456' });

    expect(authRes.status).toBe(200);
    farmerToken = authRes.body.data.tokens.accessToken;
    farmerId = authRes.body.data.user.id;

    const centresRes = await request(app).get('/api/v1/centres');
    const nagpur = centresRes.body.data.find((c: any) => c.code === 'APMC-NGP-01');
    centreId = nagpur.id;
    commodityId = nagpur.commodities[0].id;
  }, 20000);

  describe('parseSlotDateTime utility', () => {
    it('should correctly parse AM and PM times', () => {
      const d1 = parseSlotDateTime('2026-09-10', '08:30 AM');
      expect(d1).not.toBeNull();
      expect(d1!.getFullYear()).toBe(2026);
      expect(d1!.getMonth()).toBe(8); // September (0-indexed)
      expect(d1!.getDate()).toBe(10);
      expect(d1!.getHours()).toBe(8);
      expect(d1!.getMinutes()).toBe(30);

      const d2 = parseSlotDateTime('2026-09-10', '01:30 PM');
      expect(d2).not.toBeNull();
      expect(d2!.getHours()).toBe(13);
      expect(d2!.getMinutes()).toBe(30);

      const d3 = parseSlotDateTime('2026-09-10', '12:00 PM');
      expect(d3).not.toBeNull();
      expect(d3!.getHours()).toBe(12);

      const d4 = parseSlotDateTime('2026-09-10', '12:00 AM');
      expect(d4).not.toBeNull();
      expect(d4!.getHours()).toBe(0);
    });

    it('should return null for invalid time strings', () => {
      expect(parseSlotDateTime('', '')).toBeNull();
      expect(parseSlotDateTime('invalid', 'invalid')).toBeNull();
    });
  });

  describe('GET /api/v1/bookings/my-bookings', () => {
    it('should compute and include isCancellable and cancellationDeadline on bookings', async () => {
      const res = await request(app)
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length > 0) {
        const booking = res.body.data[0];
        expect(typeof booking.isCancellable).toBe('boolean');
        if (booking.slot?.slotDate && booking.slot?.startTime) {
          expect(booking.cancellationDeadline).toBeDefined();
        }
      }
    });
  });

  describe('POST /api/v1/bookings/:id/cancel', () => {
    it('should allow cancellation of a booking scheduled more than 2 hours in advance and release slot capacity', async () => {
      // Create a future slot 3 days from now
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const slot = await prisma.slot.upsert({
        where: {
          centreId_commodityId_slotDate_startTime: {
            centreId,
            commodityId,
            slotDate: futureDateStr,
            startTime: '10:00 AM',
          },
        },
        update: { bookedCapacity: 1 },
        create: {
          centreId,
          commodityId,
          slotDate: futureDateStr,
          startTime: '10:00 AM',
          endTime: '11:30 AM',
          maxCapacity: 10,
          bookedCapacity: 1,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          bookingReference: `KS-TEST-${Date.now()}`,
          farmerId,
          slotId: slot.id,
          centreId,
          commodityId,
          estimatedQuantity: 25,
          status: BookingStatus.CONFIRMED,
        },
      });

      // Cancel the booking
      const cancelRes = await request(app)
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ reason: 'Tractor breakdown on highway' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
      expect(cancelRes.body.data.cancellationReason).toBe('Tractor breakdown on highway');

      // Verify slot capacity was released (decremented from 1 to 0)
      const updatedSlot = await prisma.slot.findUnique({ where: { id: slot.id } });
      expect(updatedSlot?.bookedCapacity).toBe(0);

      // Subsequent attempt to cancel should fail
      const repeatRes = await request(app)
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ reason: 'Trying again' });

      expect(repeatRes.status).toBe(400);
      expect(repeatRes.body.error.code).toBe('ALREADY_CANCELLED');
    });

    it('should reject cancellation if slot is within 2 hours of start time', async () => {
      // Create a slot starting 30 minutes from now
      const now = new Date();
      const slotTime = new Date(now.getTime() + 30 * 60000); // 30 mins ahead
      const year = slotTime.getFullYear();
      const month = String(slotTime.getMonth() + 1).padStart(2, '0');
      const day = String(slotTime.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      let hours = slotTime.getHours();
      const meridiem = hours >= 12 ? 'PM' : 'AM';
      if (hours > 12) hours -= 12;
      if (hours === 0) hours = 12;
      const minutesStr = String(slotTime.getMinutes()).padStart(2, '0');
      const startTimeStr = `${String(hours).padStart(2, '0')}:${minutesStr} ${meridiem}`;

      const slot = await prisma.slot.upsert({
        where: {
          centreId_commodityId_slotDate_startTime: {
            centreId,
            commodityId,
            slotDate: todayStr,
            startTime: startTimeStr,
          },
        },
        update: { bookedCapacity: 1 },
        create: {
          centreId,
          commodityId,
          slotDate: todayStr,
          startTime: startTimeStr,
          endTime: '06:00 PM',
          maxCapacity: 10,
          bookedCapacity: 1,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          bookingReference: `KS-TEST-LATE-${Date.now()}`,
          farmerId,
          slotId: slot.id,
          centreId,
          commodityId,
          estimatedQuantity: 20,
          status: BookingStatus.CONFIRMED,
        },
      });

      const cancelRes = await request(app)
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ reason: 'Last minute issue' });

      expect(cancelRes.status).toBe(400);
      expect(cancelRes.body.error.code).toBe('CANCELLATION_CUTOFF_EXPIRED');
      expect(cancelRes.body.error.message).toContain('within 2 hours of arrival slot');
    });

    it('should reject cancellation if scheduled slot time has already passed', async () => {
      // Create a slot that started 2 hours ago today
      const todayStr = new Date().toISOString().split('T')[0];
      const slot = await prisma.slot.upsert({
        where: {
          centreId_commodityId_slotDate_startTime: {
            centreId,
            commodityId,
            slotDate: todayStr,
            startTime: '01:00 AM',
          },
        },
        update: { bookedCapacity: 1 },
        create: {
          centreId,
          commodityId,
          slotDate: todayStr,
          startTime: '01:00 AM',
          endTime: '02:00 AM',
          maxCapacity: 10,
          bookedCapacity: 1,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          bookingReference: `KS-TEST-PASSED-${Date.now()}`,
          farmerId,
          slotId: slot.id,
          centreId,
          commodityId,
          estimatedQuantity: 15,
          status: BookingStatus.CONFIRMED,
        },
      });

      const cancelRes = await request(app)
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ reason: 'Too late' });

      expect(cancelRes.status).toBe(400);
      expect(cancelRes.body.error.code).toBe('SLOT_ALREADY_PASSED');
    });
  });
});
