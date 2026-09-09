import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler.middleware';
import { OperationalStatus } from '@prisma/client';

export class CentreService {
  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  async listCentres(query: {
    district?: string;
    pincode?: string;
    commodityId?: string;
    status?: OperationalStatus;
    search?: string;
    lat?: number;
    lng?: number;
  }) {
    const whereClause: any = {};

    if (query.district) {
      whereClause.district = { contains: query.district, mode: 'insensitive' };
    }
    if (query.pincode) {
      whereClause.pincode = query.pincode;
    }
    if (query.status) {
      whereClause.operationalStatus = query.status;
    }
    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
        { district: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.commodityId) {
      whereClause.centreCommodities = {
        some: { commodityId: query.commodityId, isAccepted: true },
      };
    }

    const centres = await prisma.centre.findMany({
      where: whereClause,
      include: {
        centreCommodities: {
          include: { commodity: true },
        },
        incidents: {
          where: { status: { in: ['ACTIVE', 'INVESTIGATING'] } },
          select: { id: true, title: true, severity: true, impactStatement: true, pauseBookings: true },
        },
        _count: {
          select: {
            queueEntries: {
              where: { status: { in: ['WAITING', 'IN_INSPECTION'] } },
            },
          },
        },
      },
    });

    return centres.map((c) => {
      let distanceKm: number | null = null;
      if (query.lat && query.lng) {
        distanceKm = this.calculateDistanceKm(query.lat, query.lng, c.latitude, c.longitude);
      }

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        district: c.district,
        state: c.state,
        pincode: c.pincode,
        address: c.address,
        latitude: c.latitude,
        longitude: c.longitude,
        operatingHours: c.operatingHours,
        dailyCapacity: c.dailyCapacity,
        operationalStatus: c.operationalStatus,
        statusNotice: c.statusNotice,
        phone: c.phone,
        email: c.email,
        activeIncidents: c.incidents,
        activeQueueCount: c._count.queueEntries,
        commodities: c.centreCommodities.map((cc) => ({
          id: cc.commodity.id,
          name: cc.commodity.name,
          code: cc.commodity.code,
          category: cc.commodity.category,
          minMspPrice: cc.commodity.minMspPrice,
          unit: cc.commodity.unit,
        })),
        distanceKm,
      };
    });
  }

  async getCentreById(centreId: string) {
    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      include: {
        centreCommodities: {
          include: { commodity: true },
        },
        incidents: {
          where: { status: { in: ['ACTIVE', 'INVESTIGATING'] } },
          include: { updates: { orderBy: { createdAt: 'desc' } } },
        },
        staffAssignments: {
          include: { user: { include: { farmerProfile: true } } },
        },
        _count: {
          select: {
            queueEntries: { where: { status: { in: ['WAITING', 'IN_INSPECTION'] } } },
          },
        },
      },
    });

    if (!centre) {
      throw new AppError('Centre not found', 404, 'CENTRE_NOT_FOUND');
    }

    return {
      ...centre,
      activeQueueCount: centre._count.queueEntries,
    };
  }

  async updateCentreStatus(
    centreId: string,
    data: {
      operationalStatus?: OperationalStatus;
      statusNotice?: string;
      dailyCapacity?: number;
      operatingHours?: string;
    }
  ) {
    const updated = await prisma.centre.update({
      where: { id: centreId },
      data,
    });
    return updated;
  }
}

export const centreService = new CentreService();
