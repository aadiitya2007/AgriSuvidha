import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { Payment } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import {
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';

export const PaymentLedgerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { data: payments = [], isLoading, refetch } = useQuery<Payment[]>({
    queryKey: ['admin-payments'],
    queryFn: () => apiRequest('/payments'),
  });

  const disburseMutation = useMutation({
    mutationFn: (paymentId: string) =>
      apiRequest('/payments/disburse', {
        method: 'POST',
        headers: {
          'Idempotency-Key': `idemp-pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        },
        body: JSON.stringify({ paymentId, paymentMode: 'DIRECT_BENEFIT_TRANSFER' }),
      }),
    onSuccess: (data) => {
      setStatusMessage(`Payment of ₹${data.amount.toLocaleString('en-IN')} disbursed! UTR: ${data.transactionReference}`);
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setTimeout(() => setStatusMessage(null), 5000);
    },
    onError: (err: any) => {
      setStatusMessage(`Error: ${err.message}`);
    },
  });

  const handleExportCsv = async () => {
    try {
      const csv = await apiRequest('/payments/export/csv');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agrisuvidha-payments-${Date.now()}.csv`;
      a.click();
    } catch (err: any) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const totalDisbursed = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((acc, p) => acc + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === 'PENDING')
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-purple-600" />
            Direct Benefit Transfer (DBT) Payment Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Review approved procurement balances, execute direct account disbursements, and download ledgers.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="text-xs flex items-center gap-1.5 font-semibold"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Export CSV Report
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="text-xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {statusMessage && <Alert variant="info">{statusMessage}</Alert>}

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Card className="p-4 bg-emerald-50/60 border-emerald-200">
          <span className="text-slate-500 block font-semibold">Total Disbursed (DBT)</span>
          <span className="text-2xl font-black text-emerald-800 font-mono mt-1 block">
            ₹{totalDisbursed.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-600">Directly credited to Kisan accounts</span>
        </Card>

        <Card className="p-4 bg-amber-50/60 border-amber-200">
          <span className="text-slate-500 block font-semibold">Pending Approvals</span>
          <span className="text-2xl font-black text-amber-700 font-mono mt-1 block">
            ₹{totalPending.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-amber-700">Awaiting manager disbursal authorization</span>
        </Card>

        <Card className="p-4 bg-purple-50/60 border-purple-200">
          <span className="text-slate-500 block font-semibold">Bank Gateway Mode</span>
          <span className="text-base font-bold text-purple-900 mt-1 block">
            PFMS / RBI NEFT Direct Relay
          </span>
          <span className="text-[10px] text-purple-700 font-mono">Status: Connected (24/7)</span>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">
            Payment Transaction Ledger ({payments.length} Records)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3.5">Payment ID</th>
                <th className="p-3.5">Farmer Name</th>
                <th className="p-3.5">Mobile</th>
                <th className="p-3.5">Centre</th>
                <th className="p-3.5">Net Payable</th>
                <th className="p-3.5">Mode</th>
                <th className="p-3.5">Bank UTR Ref</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p: any) => {
                const isPending = p.status === 'PENDING';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono text-slate-500">{p.id.slice(0, 8)}...</td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      {p.farmer.farmerProfile?.fullName || 'Farmer'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{p.farmer.phone}</td>
                    <td className="p-3.5">{p.centre?.name || 'Mandi Centre'}</td>
                    <td className="p-3.5 font-black font-mono text-emerald-800 text-sm">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-[11px] font-mono text-slate-600">{p.paymentMode}</td>
                    <td className="p-3.5 font-mono text-xs text-slate-700">
                      {p.transactionReference || '---'}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={p.status === 'SUCCESS' ? 'success' : 'warning'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      {isPending ? (
                        <Button
                          size="sm"
                          onClick={() => disburseMutation.mutate(p.id)}
                          isLoading={disburseMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                        >
                          Disburse Funds
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
