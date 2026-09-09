import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { ProcurementRecord } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DigitalReceiptModal } from '../../components/DigitalReceiptModal';
import {
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  Scale,
  CreditCard,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const ProcurementHistoryPage: React.FC = () => {
  const [selectedReceipt, setSelectedReceipt] = useState<ProcurementRecord | null>(null);

  const { data: records = [], isLoading } = useQuery<ProcurementRecord[]>({
    queryKey: ['procurements'],
    queryFn: () => apiRequest('/procurement'),
    refetchInterval: 3000,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Procurement Records & Digital Receipts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Track official inspection grades, moisture content tests, deductions, and DBT bank disbursements.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading procurement records...</div>
      ) : records.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Procurement Submissions Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once your harvest is weighed and graded at the procurement centre, digital receipts and payment ledgers appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((r) => (
            <Card key={r.id} className="overflow-hidden hover:border-emerald-500 transition-all">
              <div className="p-6 space-y-5">
                {/* Top bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{r.commodity.name}</h3>
                      <p className="text-xs text-slate-500">{r.centre.name} • Ref: <span className="font-mono font-semibold">{r.receiptNumber}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === 'PAID' ? 'success' : 'harvest'}>
                      {r.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedReceipt(r)}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> View Receipt
                    </Button>
                  </div>
                </div>

                {/* Inspection Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block">Accepted Weight:</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">{r.acceptedWeight} {r.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Quality Grade:</span>
                    <span className="font-bold text-emerald-700 text-sm">{r.qualityGrade}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Moisture Content:</span>
                    <span className="font-bold text-slate-800 font-mono">{r.moistureContent}% (Max 14%)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Foreign Matter:</span>
                    <span className="font-bold text-slate-800 font-mono">{r.foreignMatterPercent}%</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                  <div className="space-y-1">
                    <div className="text-slate-600">
                      Baseline MSP Rate: <strong className="font-mono text-slate-900">₹{r.ratePerUnit}/{r.unit}</strong>
                    </div>
                    {r.deductions > 0 && (
                      <div className="text-red-600">
                        Deductions ({r.deductionReason}): <strong className="font-mono">-₹{r.deductions.toLocaleString('en-IN')}</strong>
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Net Payable:</span>
                    <span className="text-xl font-black text-emerald-800 font-mono">
                      ₹{r.netPayable.toLocaleString('en-IN')}
                    </span>
                    {r.payment?.transactionReference && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Ref: {r.payment.transactionReference}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedReceipt && (
        <DigitalReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          record={selectedReceipt}
        />
      )}
    </div>
  );
};
