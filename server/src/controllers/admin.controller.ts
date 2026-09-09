import { Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Role, ProcurementStatus, PaymentStatus, IncidentStatus, TicketStatus } from '@prisma/client';

export const getAdminAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalFarmers,
      totalCentres,
      totalBookings,
      activeQueueCount,
      procurementAggregates,
      paymentAggregates,
      activeIncidentsCount,
      openTicketsCount,
      recentProcurements,
      commodities,
      incidents,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.FARMER } }),
      prisma.centre.count(),
      prisma.booking.count(),
      prisma.queueEntry.count({ where: { status: { in: ['WAITING', 'IN_INSPECTION', 'CALLED'] } } }),
      prisma.procurementRecord.aggregate({
        _sum: { submittedWeight: true, acceptedWeight: true, netPayable: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.SUCCESS },
      }),
      prisma.incident.count({ where: { status: { in: [IncidentStatus.ACTIVE, IncidentStatus.INVESTIGATING] } } }),
      prisma.supportTicket.count({ where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } } }),
      prisma.procurementRecord.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { commodity: true, farmer: { include: { farmerProfile: true } }, centre: true },
      }),
      prisma.commodity.findMany({
        include: {
          _count: { select: { procurements: true } },
        },
      }),
      prisma.incident.findMany({
        where: { status: { in: [IncidentStatus.ACTIVE, IncidentStatus.INVESTIGATING] } },
        include: { centre: true },
      }),
    ]);

    // Commodity breakdown for charts
    const commodityVolumes = await prisma.procurementRecord.groupBy({
      by: ['commodityId'],
      _sum: { acceptedWeight: true, netPayable: true },
      _count: { id: true },
    });

    const commodityMap = new Map(commodities.map((c) => [c.id, c.name]));
    const chartCommodityData = commodityVolumes.map((cv) => ({
      commodity: commodityMap.get(cv.commodityId) || 'Other',
      volumeQuintals: cv._sum.acceptedWeight || 0,
      totalPayable: cv._sum.netPayable || 0,
      recordCount: cv._count.id,
    }));

    // Daily procurement throughput trend (last 7 days simulation / real data)
    const trendData = [
      { day: 'Mon', wheat: 140, soybean: 90, cotton: 45, onions: 60 },
      { day: 'Tue', wheat: 180, soybean: 110, cotton: 55, onions: 80 },
      { day: 'Wed', wheat: 210, soybean: 130, cotton: 70, onions: 95 },
      { day: 'Thu', wheat: 195, soybean: 125, cotton: 65, onions: 85 },
      { day: 'Fri', wheat: 240, soybean: 160, cotton: 80, onions: 110 },
      { day: 'Sat', wheat: 220, soybean: 145, cotton: 75, onions: 105 },
      { day: 'Today', wheat: 265, soybean: 180, cotton: 90, onions: 125 },
    ];

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalFarmers,
          totalCentres,
          totalBookings,
          activeQueueCount,
          totalProcuredWeightQuintals: procurementAggregates._sum.acceptedWeight || 0,
          totalPayableAmountInr: procurementAggregates._sum.netPayable || 0,
          totalDisbursedPaymentsInr: paymentAggregates._sum.amount || 0,
          activeIncidentsCount,
          openTicketsCount,
        },
        chartCommodityData,
        trendData,
        recentProcurements,
        activeIncidents: incidents,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const action = req.query.action as string;

    const where: any = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { phone: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as Role;
    const where: any = {};
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      include: {
        farmerProfile: true,
        staffAssignments: { include: { centre: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};
