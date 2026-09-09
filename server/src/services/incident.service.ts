import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler.middleware';
import { IncidentType, IncidentSeverity, IncidentStatus, OperationalStatus } from '@prisma/client';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';

export class IncidentService {
  async listIncidents(filter?: { centreId?: string; status?: IncidentStatus }) {
    const where: any = {};
    if (filter?.centreId) where.centreId = filter.centreId;
    if (filter?.status) where.status = filter.status;

    return await prisma.incident.findMany({
      where,
      include: {
        centre: true,
        reportedBy: { select: { email: true, phone: true } },
        updates: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reportIncident(data: {
    centreId: string;
    title: string;
    incidentType: IncidentType;
    severity: IncidentSeverity;
    impactStatement: string;
    expectedRecoveryTime?: Date;
    pauseBookings: boolean;
    reportedByUserId: string;
  }) {
    const { centreId, title, incidentType, severity, impactStatement, expectedRecoveryTime, pauseBookings, reportedByUserId } = data;

    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      throw new AppError('Centre not found', 404, 'CENTRE_NOT_FOUND');
    }

    // Count affected bookings
    const affectedCount = await prisma.booking.count({
      where: {
        centreId,
        status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN'] },
      },
    });

    // Map incident type to operational status
    let newCentreStatus: OperationalStatus = OperationalStatus.LIMITED_SERVICE;
    if (incidentType === IncidentType.SERVER_OUTAGE || incidentType === IncidentType.POWER_OUTAGE) {
      newCentreStatus = OperationalStatus.SYSTEM_OUTAGE;
    } else if (incidentType === IncidentType.EMERGENCY_CLOSURE) {
      newCentreStatus = OperationalStatus.TEMPORARILY_CLOSED;
    } else if (incidentType === IncidentType.LOGISTICS_DELAY) {
      newCentreStatus = OperationalStatus.LOGISTICS_DELAYED;
    }

    const incident = await prisma.$transaction(async (tx) => {
      const inc = await tx.incident.create({
        data: {
          centreId,
          title,
          incidentType,
          severity,
          impactStatement,
          status: IncidentStatus.ACTIVE,
          affectedBookingsCount: affectedCount,
          expectedRecoveryTime: expectedRecoveryTime || null,
          pauseBookings,
          reportedByUserId,
          updates: {
            create: {
              userId: reportedByUserId,
              message: `Incident declared: ${title}. ${impactStatement}`,
            },
          },
        },
        include: { updates: true, centre: true },
      });

      // Update centre operational status
      await tx.centre.update({
        where: { id: centreId },
        data: {
          operationalStatus: newCentreStatus,
          statusNotice: impactStatement,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: reportedByUserId,
          userRole: 'STAFF',
          action: 'INCIDENT_REPORTED',
          resourceType: 'INCIDENT',
          resourceId: inc.id,
          metadata: JSON.stringify({ title, severity, affectedCount, pauseBookings }),
        },
      });

      return inc;
    });

    // Trigger targeted notifications to all affected farmers
    await notificationService.notifyTargetedFarmersForIncident(
      centreId,
      `Operational Notice: ${centre.name}`,
      `${title}: ${impactStatement}. Please check the app for reschedule options.`
    );

    return incident;
  }

  async addIncidentUpdate(params: {
    incidentId: string;
    userId: string;
    message: string;
    isResolved?: boolean;
  }) {
    const { incidentId, userId, message, isResolved } = params;

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { centre: true },
    });

    if (!incident) {
      throw new AppError('Incident not found', 404, 'NOT_FOUND');
    }

    return await prisma.$transaction(async (tx) => {
      await tx.incidentUpdate.create({
        data: {
          incidentId,
          userId,
          message,
        },
      });

      let updated = incident;
      if (isResolved) {
        updated = await tx.incident.update({
          where: { id: incidentId },
          data: {
            status: IncidentStatus.RESOLVED,
            resolvedAt: new Date(),
          },
          include: { updates: true, centre: true },
        });

        // Check if other active incidents remain for centre
        const otherActive = await tx.incident.count({
          where: {
            centreId: incident.centreId,
            status: { in: [IncidentStatus.ACTIVE, IncidentStatus.INVESTIGATING] },
            id: { not: incidentId },
          },
        });

        if (otherActive === 0) {
          // Restore centre to OPERATIONAL
          await tx.centre.update({
            where: { id: incident.centreId },
            data: {
              operationalStatus: OperationalStatus.OPERATIONAL,
              statusNotice: 'Operations fully normal and restored.',
            },
          });
        }

        // Notify affected farmers that service has resumed
        await notificationService.notifyTargetedFarmersForIncident(
          incident.centreId,
          `Service Restored: ${incident.centre.name}`,
          `The incident (${incident.title}) has been resolved. Normal procurement operations have resumed.`
        );
      }

      return updated;
    });
  }
}

export const incidentService = new IncidentService();
