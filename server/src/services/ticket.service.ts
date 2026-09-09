import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler.middleware';
import { TicketStatus, TicketPriority, NotificationCategory } from '@prisma/client';
import { notificationService } from './notification.service';

export class TicketService {
  async createTicket(data: {
    userId: string;
    centreId?: string;
    category: string;
    priority?: TicketPriority;
    subject: string;
    description?: string;
    message?: string;
  }) {
    const { userId, centreId, category, priority, subject } = data;
    const description = data.description || data.message || 'Support inquiry';
    const ticketNumber = `TCK-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId,
        centreId: centreId || null,
        category,
        priority: priority || TicketPriority.MEDIUM,
        subject,
        description,
        comments: {
          create: {
            userId,
            message: description,
            isStaff: false,
          },
        },
      },
      include: {
        centre: true,
        comments: true,
      },
    });

    return ticket;
  }

  async listTickets(filter: { userId?: string; centreId?: string; status?: TicketStatus }) {
    const where: any = {};
    if (filter.userId) where.userId = filter.userId;
    if (filter.centreId) where.centreId = filter.centreId;
    if (filter.status) where.status = filter.status;

    return await prisma.supportTicket.findMany({
      where,
      include: {
        user: { include: { farmerProfile: true } },
        centre: true,
        comments: {
          include: { user: { include: { farmerProfile: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(params: {
    ticketId: string;
    userId: string;
    message: string;
    isStaff: boolean;
    updateStatus?: TicketStatus;
  }) {
    const { ticketId, userId, message, isStaff, updateStatus } = params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404, 'NOT_FOUND');
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        userId,
        message,
        isStaff,
      },
    });

    if (updateStatus) {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: updateStatus },
      });
    }

    // If staff commented, notify farmer
    if (isStaff) {
      await notificationService.sendNotification({
        userId: ticket.userId,
        title: `Reply on Support Ticket ${ticket.ticketNumber}`,
        body: message.length > 80 ? `${message.substring(0, 80)}...` : message,
        category: NotificationCategory.SUPPORT,
        actionUrl: `/support`,
      });
    }

    return comment;
  }

  async submitFeedback(data: {
    userId: string;
    centreId: string;
    bookingId?: string;
    rating: number;
    category?: string;
    comments?: string;
    aspectScores?: { queue: number; staff: number; transparency: number; facilities: number };
  }) {
    const { userId, centreId, bookingId, rating, category, comments, aspectScores } = data;

    return await prisma.feedback.create({
      data: {
        userId,
        centreId,
        bookingId: bookingId || null,
        rating,
        category: category || 'Procurement Experience',
        comments: comments || null,
        aspectScores: aspectScores ? JSON.stringify(aspectScores) : null,
      },
    });
  }

  async listFeedback(centreId?: string) {
    const where: any = {};
    if (centreId) where.centreId = centreId;

    return await prisma.feedback.findMany({
      where,
      include: {
        user: { include: { farmerProfile: true } },
        centre: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const ticketService = new TicketService();
