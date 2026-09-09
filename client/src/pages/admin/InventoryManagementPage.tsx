import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { Order, Product } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { ShoppingBag, PackageCheck, AlertCircle, Check } from 'lucide-react';

export const InventoryManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [pickupOtpInput, setPickupOtpInput] = useState('');
  const [verifiedOrder, setVerifiedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: () => apiRequest('/orders'),
  });

  // Fetch products catalogue
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['admin-products'],
    queryFn: () => apiRequest('/products'),
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (data) => {
      setMessage(`Order ${data.orderNumber} marked as ${data.status}!`);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setTimeout(() => setMessage(null), 4000);
    },
  });

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const match = orders.find((o) => o.pickupOtp === pickupOtpInput.trim());
    if (match) {
      setVerifiedOrder(match);
      setMessage(`Order ${match.orderNumber} located!`);
    } else {
      alert('No pending order found with this pickup OTP.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-8 h-8 text-emerald-600" />
          Mandi Supply Store & Order Fulfilment
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Verify farmer pickup OTPs, manage seed & fertilizer stock levels, and fulfill orders.
        </p>
      </div>

      {message && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold">{message}</div>}

      {/* Pickup Verification Quick Card */}
      <Card className="p-6 bg-slate-900 text-white space-y-4 shadow-md">
        <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <PackageCheck className="w-4 h-4" />
          Verify Farmer Pickup Order via OTP
        </h3>
        <form onSubmit={handleVerifyOtp} className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <Input
            placeholder="Enter Farmer 6-Digit Pickup OTP (e.g. 812490)..."
            value={pickupOtpInput}
            onChange={(e) => setPickupOtpInput(e.target.value)}
            className="text-xs bg-slate-800 border-slate-700 text-white font-mono"
            required
          />
          <Button type="submit" className="text-xs font-bold whitespace-nowrap bg-emerald-600 hover:bg-emerald-500">
            Verify & Deliver
          </Button>
        </form>

        {verifiedOrder && (
          <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between font-bold">
              <span>Order #{verifiedOrder.orderNumber}</span>
              <span className="text-emerald-400 font-mono">₹{verifiedOrder.totalAmount}</span>
            </div>
            <p className="text-slate-300">Status: {verifiedOrder.status}</p>
            {verifiedOrder.status !== 'FULFILLED' && (
              <Button
                size="sm"
                onClick={() => {
                  updateStatusMutation.mutate({ orderId: verifiedOrder.id, status: 'FULFILLED' });
                  setVerifiedOrder(null);
                  setPickupOtpInput('');
                }}
                className="text-xs bg-emerald-600 hover:bg-emerald-500"
              >
                Mark Handed Over / Fulfilled
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">
            Recent Pickup Orders ({orders.length} Orders)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3.5">Order Number</th>
                <th className="p-3.5">Centre</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Pickup OTP</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord: any) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                  <td className="p-3.5">{ord.centre.name}</td>
                  <td className="p-3.5 font-medium">
                    {ord.items?.map((it: any) => `${it.product.name} (x${it.quantity})`).join(', ')}
                  </td>
                  <td className="p-3.5 font-bold font-mono text-emerald-800">₹{ord.totalAmount}</td>
                  <td className="p-3.5 font-mono font-bold text-slate-700">{ord.pickupOtp || '---'}</td>
                  <td className="p-3.5">
                    <Badge variant={ord.status === 'FULFILLED' ? 'success' : 'harvest'}>
                      {ord.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    {ord.status === 'PLACED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ orderId: ord.id, status: 'READY_FOR_PICKUP' })}
                        className="text-[11px]"
                      >
                        Pack & Ready
                      </Button>
                    )}
                    {ord.status === 'READY_FOR_PICKUP' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ orderId: ord.id, status: 'FULFILLED' })}
                        className="text-[11px] bg-emerald-600"
                      >
                        Deliver
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stock Levels Table */}
      <Card>
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">
            Commodity & Supplies Warehouse Inventory
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Unit Price</th>
                <th className="p-3.5">Current Stock</th>
                <th className="p-3.5">Stock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                  <td className="p-3.5">{p.category.name}</td>
                  <td className="p-3.5 font-mono">₹{p.price} / {p.unit}</td>
                  <td className="p-3.5 font-mono font-bold">{p.stockQuantity} units</td>
                  <td className="p-3.5">
                    <Badge variant={p.stockQuantity > 50 ? 'success' : 'warning'}>
                      {p.stockQuantity > 50 ? 'In Stock' : 'Low Stock Warning'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
