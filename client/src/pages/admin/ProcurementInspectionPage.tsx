import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ProcurementRecord, Booking } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { DigitalReceiptModal } from '../../components/DigitalReceiptModal';
import {
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

export const ProcurementInspectionPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedReceipt, setSelectedReceipt] = useState<ProcurementRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Inspection Form State
  const [bookingId, setBookingId] = useState('');
  const [submittedWeight, setSubmittedWeight] = useState<number>(50.0);
  const [moistureContent, setMoistureContent] = useState<number>(11.5);
  const [foreignMatterPercent, setForeignMatterPercent] = useState<number>(0.8);
  const [inspectionNotes, setInspectionNotes] = useState('');

  const isManagerOrAdmin = user?.role === 'CENTRE_MANAGER' || user?.role === 'PLATFORM_ADMIN';

  // Fetch checked-in bookings eligible for inspection
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['inspectable-bookings'],
    queryFn: () => apiRequest('/bookings/my-bookings'),
  });

  // Fetch all procurement records
  const { data: records = [], refetch } = useQuery<ProcurementRecord[]>({
    queryKey: ['admin-procurements'],
    queryFn: () => apiRequest('/procurement'),
  });

  // Submit Inspection Mutation
  const inspectMutation = useMutation({
    mutationFn: (payload: any) =>
      apiRequest('/procurement/inspect', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setStatusMessage(`Procurement record ${data.receiptNumber} recorded successfully! Assigned Grade: ${data.qualityGrade}`);
      queryClient.invalidateQueries({ queryKey: ['admin-procurements'] });
      setBookingId('');
      setInspectionNotes('');
    },
    onError: (err: any) => {
      setStatusMessage(`Error: ${err.message}`);
    },
  });

  // Manager Decision Mutation
  const decisionMutation = useMutation({
    mutationFn: ({ recordId, action, notes }: { recordId: string; action: string; notes?: string }) =>
      apiRequest(`/procurement/${recordId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ action, notes }),
      }),
    onSuccess: (data) => {
      setStatusMessage(`Procurement status updated to ${data.status}. Linked payment ledger initialized.`);
      queryClient.invalidateQueries({ queryKey: ['admin-procurements'] });
    },
    onError: (err: any) => {
      setStatusMessage(`Error: ${err.message}`);
    },
  });

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      alert('Please select a checked-in booking reference');
      return;
    }
    inspectMutation.mutate({
      bookingId,
      submittedWeight: Number(submittedWeight),
      moistureContent: Number(moistureContent),
      foreignMatterPercent: Number(foreignMatterPercent),
      inspectionNotes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-8 h-8 text-emerald-600" />
            Quality Inspection & Grading Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Record electronic weighbridge measurements, automated moisture grading, and manager approvals.
          </p>
        </div>
      </div>

      {statusMessage && <Alert variant="info">{statusMessage}</Alert>}

      {/* Operator Weighing & Inspection Input Desk */}
      <Card className="p-6 bg-white shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          Record New Scale Inspection & Moisture Test
        </h3>

        <form onSubmit={handleInspectSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Checked-In Booking
              </label>
              <Select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                required
              >
                <option value="">-- Choose Arrival Booking --</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bookingReference} - {b.commodity.name} ({b.estimatedQuantity} Qtl)
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Input
                label="Electronic Gross Scale Weight (Quintals)"
                type="number"
                step="0.1"
                min="0.1"
                value={submittedWeight}
                onChange={(e) => setSubmittedWeight(parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="Moisture Content % (Max 14% FAQ)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={moistureContent}
                onChange={(e) => setMoistureContent(parseFloat(e.target.value))}
                required
              />
            </div>

            <div>
              <Input
                label="Foreign Matter / Dockage % (Max 2%)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={foreignMatterPercent}
                onChange={(e) => setForeignMatterPercent(parseFloat(e.target.value))}
                required
              />
            </div>

            <div>
              <Input
                label="Inspector Remarks"
                placeholder="Clean golden grains, no weevils..."
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Grade Calculation Preview */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between text-xs text-emerald-900 font-semibold gap-2">
            <span>
              Estimated Grade: <strong className="uppercase">{moistureContent > 16 ? 'REJECTED' : moistureContent > 14 ? 'GRADE C' : moistureContent > 12 ? 'GRADE B' : 'GRADE A'}</strong>
            </span>
            <span>
              Moisture Standard: {moistureContent <= 12 ? 'Optimal (0% deduction)' : 'Adjustment applies'}
            </span>
            <Button
              type="submit"
              size="sm"
              isLoading={inspectMutation.isPending}
              className="font-bold"
            >
              Save Inspection & Submit to Manager &rarr;
            </Button>
          </div>
        </form>
      </Card>

      {/* Roster of Records awaiting Manager Approval */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Procurement Ledger ({records.length} Records)
          </h3>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3.5">Receipt No</th>
                <th className="p-3.5">Farmer</th>
                <th className="p-3.5">Commodity</th>
                <th className="p-3.5">Weight</th>
                <th className="p-3.5">Moisture</th>
                <th className="p-3.5">Grade</th>
                <th className="p-3.5">Net Payable</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => {
                const isAwaitingApproval = r.status === 'UNDER_INSPECTION';

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{r.receiptNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      {r.farmer.farmerProfile?.fullName || 'Farmer'}
                    </td>
                    <td className="p-3.5 font-medium">{r.commodity.name}</td>
                    <td className="p-3.5 font-mono">{r.submittedWeight} {r.unit}</td>
                    <td className="p-3.5 font-mono">{r.moistureContent}%</td>
                    <td className="p-3.5">
                      <Badge variant={r.qualityGrade === 'GRADE_A' ? 'success' : 'warning'}>
                        {r.qualityGrade}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-bold font-mono text-emerald-800">
                      ₹{r.netPayable.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={r.status === 'PAID' ? 'success' : isAwaitingApproval ? 'warning' : 'harvest'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReceipt(r)}
                        className="text-[11px]"
                      >
                        <Printer className="w-3 h-3 mr-1 inline" /> Receipt
                      </Button>

                      {isAwaitingApproval && isManagerOrAdmin && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              decisionMutation.mutate({ recordId: r.id, action: 'APPROVE' })
                            }
                            className="text-[11px] bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              decisionMutation.mutate({ recordId: r.id, action: 'REJECT' })
                            }
                            className="text-[11px] text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-3 h-3 mr-1 inline" /> Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

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
