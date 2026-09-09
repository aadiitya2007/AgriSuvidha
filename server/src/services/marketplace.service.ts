import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler.middleware';
import { OrderStatus, NotificationCategory } from '@prisma/client';
import { generateNumericOtp } from '../utils/crypto';
import { notificationService } from './notification.service';

export class MarketplaceService {
  async listProducts(categoryId?: string, search?: string) {
    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async listCategories() {
    return await prisma.productCategory.findMany({
      include: { _count: { select: { products: true } } },
    });
  }

  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: { include: { product: true } },
        },
      });
    }

    const total = cart.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    return {
      ...cart,
      totalAmount: Math.round(total * 100) / 100,
      itemCount: cart.items.reduce((acc, item) => acc + item.quantity, 0),
    };
  }

  async addToCart(userId: string, productId: string, quantity: number) {
    const cart = await this.getCart(userId);
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    const existingItem = cart.items.find((i) => i.productId === productId);

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return await this.getCart(userId);
  }

  async updateCartItem(userId: string, productId: string, quantity: number) {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.productId === productId);

    if (!item) {
      throw new AppError('Item not found in cart', 404, 'NOT_FOUND');
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      });
    }

    return await this.getCart(userId);
  }

  async createOrder(userId: string, centreId: string) {
    const cart = await this.getCart(userId);
    if (!cart.items || cart.items.length === 0) {
      throw new AppError('Your cart is empty', 400, 'CART_EMPTY');
    }

    const pickupOtp = generateNumericOtp(6);
    const orderNumber = `ORD-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          farmerId: userId,
          centreId,
          totalAmount: cart.totalAmount,
          status: OrderStatus.PLACED,
          pickupOtp,
          pickupQr: `QR-${orderNumber}`,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
              totalPrice: item.product.price * item.quantity,
            })),
          },
        },
        include: { items: { include: { product: true } }, centre: true },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          userRole: 'FARMER',
          action: 'ORDER_PLACED',
          resourceType: 'ORDER',
          resourceId: order.id,
          metadata: JSON.stringify({ orderNumber, total: cart.totalAmount }),
        },
      });

      return order;
    });
  }

  async listFarmerOrders(farmerId: string) {
    return await prisma.order.findMany({
      where: { farmerId },
      include: {
        centre: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAllOrders(centreId?: string) {
    const where: any = {};
    if (centreId) where.centreId = centreId;

    return await prisma.order.findMany({
      where,
      include: {
        farmer: { include: { farmerProfile: true } },
        centre: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, staffUserId: string) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { farmer: true, centre: true },
    });

    if (status === OrderStatus.READY_FOR_PICKUP) {
      await notificationService.sendNotification({
        userId: order.farmerId,
        title: `Order ${order.orderNumber} Ready for Pickup!`,
        body: `Your order is packed and ready at ${order.centre.name}. Keep your OTP ${order.pickupOtp} ready.`,
        category: NotificationCategory.ORDER,
        actionUrl: `/store/orders`,
      });
    }

    return order;
  }
}

export const marketplaceService = new MarketplaceService();
