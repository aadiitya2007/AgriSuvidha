import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { Product, CartItem, Order, Centre } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { QrCodeModal } from '../../components/QrCodeModal';
import {
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Package,
  QrCode,
  Tag,
} from 'lucide-react';

export const AgriStorePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutCentreId, setCheckoutCentreId] = useState<string>('');
  const [selectedQrOrder, setSelectedQrOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch Products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products', selectedCategory, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (search) params.append('search', search);
      return apiRequest(`/products?${params.toString()}`);
    },
  });

  // Fetch Cart
  const { data: cart } = useQuery<{ items: CartItem[]; totalAmount: number; itemCount: number }>({
    queryKey: ['cart'],
    queryFn: () => apiRequest('/products/cart'),
  });

  // Fetch Centres for Pickup
  const { data: centres = [] } = useQuery<Centre[]>({
    queryKey: ['centres'],
    queryFn: () => apiRequest('/centres'),
  });

  // Fetch My Orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: () => apiRequest('/orders'),
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (productId: string) =>
      apiRequest('/products/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: 1 }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setMessage('Item added to cart!');
      setTimeout(() => setMessage(null), 2000);
    },
  });

  // Update cart item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      apiRequest('/products/cart', {
        method: 'PATCH',
        body: JSON.stringify({ productId, quantity }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: (centreId: string) =>
      apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({ centreId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setCartDrawerOpen(false);
      setActiveTab('orders');
    },
  });

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutCentreId && centres.length > 0) {
      checkoutMutation.mutate(centres[0].id);
    } else {
      checkoutMutation.mutate(checkoutCentreId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-emerald-600" />
            Kisan Agri Store & Supplies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Order certified seeds, government-subsidized bio-fertilizers, gunny storage bags, and sprayers for APMC pickup.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                activeTab === 'catalog' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              Product Catalogue
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                activeTab === 'orders' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              My Orders ({orders.length})
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => setCartDrawerOpen(true)}
            className="flex items-center gap-2 text-xs relative"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart</span>
            {(cart?.itemCount || 0) > 0 && (
              <span className="bg-amber-400 text-amber-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                {cart?.itemCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {activeTab === 'catalog' ? (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search certified seeds, nano urea, sprayers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="sm:w-64">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-medium"
              >
                <option value="">All Categories</option>
                <option value="seeds">Certified Hybrid Seeds</option>
                <option value="fertilizers">Bio-Fertilizers & Nutrients</option>
                <option value="packaging">Storage & Packaging</option>
                <option value="tools">Agri Equipment & Sprayers</option>
              </Select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <Card key={p.id} className="flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition-all">
                <div className="p-5 space-y-3">
                  <div className="aspect-video bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 text-3xl font-bold">
                    🌾
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {p.category.name}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{p.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-slate-900 font-mono">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-400 block">per {p.unit}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addToCartMutation.mutate(p.id)}
                    isLoading={addToCartMutation.isPending}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* My Orders View */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 text-xs">
              No previous orders. Browse supplies to place your first pickup order.
            </Card>
          ) : (
            orders.map((ord) => (
              <Card key={ord.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">Order #{ord.orderNumber}</span>
                    <span className="text-slate-400 block">{new Date(ord.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={ord.status === 'READY_FOR_PICKUP' ? 'success' : 'harvest'}>
                      {ord.status}
                    </Badge>
                    <span className="font-black text-slate-900 text-base font-mono">
                      ₹{ord.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Pickup Centre</span>
                    <p className="font-semibold text-slate-800">{ord.centre.name}</p>
                    <p className="text-slate-500">{ord.centre.address}</p>
                  </div>
                  {ord.pickupOtp && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Pickup Verification OTP</span>
                        <span className="font-mono text-2xl font-black text-emerald-700 tracking-widest">
                          {ord.pickupOtp}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedQrOrder(ord)}
                        className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                      >
                        <QrCode className="w-4 h-4" /> Show Pickup QR
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Items Ordered:</span>
                  <div className="divide-y divide-slate-100">
                    {ord.items.map((it) => (
                      <div key={it.id} className="py-1.5 flex justify-between text-xs text-slate-700">
                        <span>{it.product.name} (x{it.quantity})</span>
                        <span className="font-mono font-semibold">₹{it.totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Cart Drawer / Modal */}
      <Modal isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} title="Your Agricultural Cart" maxWidth="md">
        <div className="space-y-4 text-xs">
          {!cart?.items || cart.items.length === 0 ? (
            <p className="text-center py-8 text-slate-400">Your cart is empty.</p>
          ) : (
            <div className="space-y-3">
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-800">{item.product.name}</h5>
                      <span className="text-slate-400 text-[11px]">₹{item.product.price} / {item.product.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantityMutation.mutate({ productId: item.productId, quantity: item.quantity - 1 })
                        }
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold font-mono px-1">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantityMutation.mutate({ productId: item.productId, quantity: item.quantity + 1 })
                        }
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold font-mono text-slate-900 w-16 text-right">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between font-bold text-sm text-emerald-900">
                <span>Total Amount:</span>
                <span className="font-mono text-base">₹{cart.totalAmount.toLocaleString('en-IN')}</span>
              </div>

              {/* Select Pickup Centre */}
              <form onSubmit={handleCheckout} className="space-y-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select APMC Centre for Pickup
                  </label>
                  <Select
                    value={checkoutCentreId || (centres[0]?.id || '')}
                    onChange={(e) => setCheckoutCentreId(e.target.value)}
                    required
                  >
                    {centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.district})
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="submit"
                  isLoading={checkoutMutation.isPending}
                  className="w-full text-sm font-bold shadow-sm"
                >
                  Place Order for Mandi Pickup &rarr;
                </Button>
              </form>
            </div>
          )}
        </div>
      </Modal>
      {selectedQrOrder && (
        <QrCodeModal
          isOpen={!!selectedQrOrder}
          onClose={() => setSelectedQrOrder(null)}
          bookingReference={selectedQrOrder.orderNumber}
          qrPayload={JSON.stringify({
            orderId: selectedQrOrder.id,
            orderNumber: selectedQrOrder.orderNumber,
            pickupOtp: selectedQrOrder.pickupOtp,
            centreId: selectedQrOrder.centre?.id || '',
          })}
          otpCode={selectedQrOrder.pickupOtp || undefined}
          centreName={selectedQrOrder.centre?.name || 'APMC Procurement Yard'}
          commodityName="Agricultural Supplies Order"
        />
      )}
    </div>
  );
};
