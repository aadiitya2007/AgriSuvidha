import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ProcurementRecord, Booking, Centre } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { DigitalReceiptModal } from '../../components/DigitalReceiptModal';
import { playNotificationSound, playSuccessSound } from '../../utils/sound';
import {
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileCheck,
  AlertCircle,
  CheckCheck,
  Filter,
  Building,
} from 'lucide-react';

export const ProcurementInspectionPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedReceipt, setSelectedReceipt] = useState<ProcurementRecord | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedCentreId, setSelectedCentreId] = useState<string>('');

  // Fetch Centres
  const { data: centres = [] } = useQuery<Centre[]>({
    queryKey: ['centres'],
    queryFn: () => apiRequest('/centres'),
  });

  const assigned = (user as any)?.assignedCentres?.[0]?.centreId || (user as any)?.staffAssignments?.[0]?.centreId;

  React.useEffect(() => {
    if (assigned && !selectedCentreId) {
      setSelectedCentreId(assigned);
    } else if (!selectedCentreId && centres.length > 0) {
      setSelectedCentreId(centres[0].id);
    }
  }, [centres, user, assigned, selectedCentreId]);

  // New Inspection Form State
  const [bookingId, setBookingId] = useState('');
  const [submittedWeight, setSubmittedWeight] = useState<number>(50.0);
  const [moistureContent, setMoistureContent] = useState<number>(11.5);
  const [foreignMatterPercent, setForeignMatterPercent] = useState<number>(0.8);
  const [inspectionNotes, setInspectionNotes] = useState('');

  const isManagerOrAdmin = user?.role === 'CENTRE_MANAGER' || user?.role === 'PLATFORM_ADMIN';

  // Fetch checked-in bookings eligible for inspection
  const { data: bookings = [], refetch: refetchBookings } = useQuery<Booking[]>({
    queryKey: ['inspectable-bookings', selectedCentreId],
    queryFn: () =>
      apiRequest(`/bookings/my-bookings${selectedCentreId ? `?centreId=${selectedCentreId}` : ''}`),
    refetchInterval: 3000,
  });

  // Fetch all procurement records with real-time sync
  const { data: records = [], refetch } = useQuery<ProcurementRecord[]>({
    queryKey: ['admin-procurements', selectedCentreId],
    queryFn: () =>
      apiRequest(`/procurement${selectedCentreId ? `?centreId=${selectedCentreId}` : ''}`),
    refetchInterval: 3000,
  });

  // Filter out any grain consignment that has ALREADY been inspected or completed
  const uninspectedBookings = bookings.filter((b) => {
    const hasRecordInDb = !!b.procurementRecord;
    const hasRecordInTable = records.some((r) => r.bookingId === b.id);
    const isCompleted = b.status === 'COMPLETED' || b.status === 'CANCELLED';
    return !hasRecordInDb && !hasRecordInTable && !isCompleted;
  });

  const handleBookingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setBookingId(id);
    const selected = uninspectedBookings.find((b) => b.id === id);
    if (selected && selected.estimatedQuantity) {
      setSubmittedWeight(selected.estimatedQuantity);
    }
  };

  // Submit Inspection Mutation
  const inspectMutation = useMutation({
    mutationFn: (payload: any) =>
      apiRequest('/procurement/inspect', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      playNotificationSound();
      setStatusMessage(`Consignment ${data.receiptNumber} recorded! Quality Grade: ${data.qualityGrade}. Grain lot moved to Manager Approval Ledger.`);
      queryClient.invalidateQueries({ queryKey: ['admin-procurements'] });
      queryClient.invalidateQueries({ queryKey: ['inspectable-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      refetch();
      refetchBookings();
      setBookingId('');
      setInspectionNotes('');
      setFilterTab('PENDING');
      setTimeout(() => setStatusMessage(null), 6000);
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
      playSuccessSound();
      const isApproved = data.status === 'APPROVED';
      setStatusMessage(
        isApproved
          ? `Consignment ${data.receiptNumber || ''} APPROVED! Grain marked COMPLETED and DBT payment ledger initialized.`
          : `Consignment REJECTED. Grain marked as rejected.`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-procurements'] });
      queryClient.invalidateQueries({ queryKey: ['inspectable-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      refetch();
      refetchBookings();
      setTimeout(() => setStatusMessage(null), 6000);
    },
    onError: (err: any) => {
      setStatusMessage(`Error: ${err.message}`);
    },
  });

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      alert('Please select a checked-in grain booking reference');
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

      {/* Regional Centre Quick Switcher Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-emerald-600" />
          Mandi Region:
        </span>
        {centres.map((c) => {
          const isSelected = c.id === selectedCentreId;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCentreId(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{c.district} APMC</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {c.code}
              </span>
            </button>
          );
        })}
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
                Select Arrived Grain Lot ({uninspectedBookings.length} Awaiting Test)
              </label>
              <Select
                value={bookingId}
                onChange={handleBookingSelect}
                required
              >
                <option value="">
                  {uninspectedBookings.length === 0
                    ? '-- All Arrived Grain Lots Have Been Inspected --'
                    : '-- Choose Arrived Grain Consignment --'}
                </option>
                {uninspectedBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bookingReference} • {b.commodity?.name || 'Grain'} • {b.estimatedQuantity} Qtl ({b.farmer?.farmerProfile?.fullName || 'Farmer'})
                  </option>
                ))}
              </Select>
              {uninspectedBookings.length === 0 && (
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                  <CheckCheck className="w-3.5 h-3.5" /> All arrived grain lots have been tested. Each grain consignment can only be inspected once.
                </p>
              )}
            </div>

            <div>
              <Input
                label="Electronic Gross Scale Weight (Quintals)"
                type="number"
                step="0.1"
                min="0.1"
                value={submittedWeight}
                onChange={(e) => setSubmittedWeight(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="Moisture Content % (Max 14% FAQ Standard)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={moistureContent}
                onChange={(e) => setMoistureContent(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Input
                label="Foreign Matter / Dockage % (Max 2% Standard)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={foreignMatterPercent}
                onChange={(e) => setForeignMatterPercent(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Input
                label="Assayer / Inspector Remarks"
                placeholder="Clean golden grains, standard dockage..."
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Grade Calculation Preview */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between text-xs text-emerald-900 font-semibold gap-2">
            <span>
              Assigned Quality: <strong className="uppercase">{moistureContent > 16 ? 'REJECTED' : moistureContent > 14 ? 'GRADE C' : moistureContent > 12 ? 'GRADE B' : 'GRADE A'}</strong>
            </span>
            <span>
              Moisture Deduction: {moistureContent <= 12 ? 'Zero (Optimal Dry Grain)' : moistureContent <= 14 ? 'Minor FAQ Dockage' : 'Standard Moisture Cut'}
            </span>
            <Button
              type="submit"
              size="sm"
              isLoading={inspectMutation.isPending}
              disabled={uninspectedBookings.length === 0 || !bookingId}
              className="font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              Log Scale Test & Forward to Manager &rarr;
            </Button>
          </div>
        </form>
      </Card>

      {/* Roster of Records with Tabs */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900">
              Procurement & Grading Ledger
            </h3>
            <Badge variant="neutral" className="text-xs">
              {records.length} Total
            </Badge>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setFilterTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                filterTab === 'PENDING'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Awaiting Approval ({records.filter((r) => r.status === 'UNDER_INSPECTION').length})
            </button>
            <button
              onClick={() => setFilterTab('APPROVED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                filterTab === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approved & DBT ({records.filter((r) => r.status === 'APPROVED' || r.status === 'PAID').length})
            </button>
            <button
              onClick={() => setFilterTab('REJECTED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                filterTab === 'REJECTED'
                  ? 'bg-red-100 text-red-900 border border-red-300'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Rejected ({records.filter((r) => r.status === 'REJECTED').length})
            </button>
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterTab === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Records
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
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
              {records
                .filter((r) => {
                  if (filterTab === 'PENDING') return r.status === 'UNDER_INSPECTION';
                  if (filterTab === 'APPROVED') return r.status === 'APPROVED' || r.status === 'PAID';
                  if (filterTab === 'REJECTED') return r.status === 'REJECTED';
                  return true;
                })
                .map((r) => {
                  const isAwaitingApproval = r.status === 'UNDER_INSPECTION';
                  const isApproved = r.status === 'APPROVED' || r.status === 'PAID';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{r.receiptNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {r.farmer?.farmerProfile?.fullName || 'Farmer'}
                      </td>
                      <td className="p-3.5 font-medium">{r.commodity?.name}</td>
                      <td className="p-3.5 font-mono">{r.submittedWeight} {r.unit}</td>
                      <td className="p-3.5 font-mono">{r.moistureContent}%</td>
                      <td className="p-3.5">
                        <Badge variant={r.qualityGrade === 'GRADE_A' ? 'success' : r.qualityGrade === 'REJECTED' ? 'danger' : 'warning'}>
                          {r.qualityGrade}
                        </Badge>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-emerald-800">
                        ₹{(r.netPayable || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5">
                        <Badge variant={isApproved ? 'success' : isAwaitingApproval ? 'warning' : 'danger'}>
                          {r.status === 'UNDER_INSPECTION' ? 'AWAITING APPROVAL' : r.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedReceipt(r)}
                          className="text-[11px]"
                        >
                          <Printer className="w-3 h-3 mr-1 inline" /> Certified Receipt
                        </Button>

                        {isAwaitingApproval && isManagerOrAdmin && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                decisionMutation.mutate({ recordId: r.id, action: 'APPROVE' })
                              }
                              isLoading={decisionMutation.isPending}
                              className="text-[11px] bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                decisionMutation.mutate({ recordId: r.id, action: 'REJECT' })
                              }
                              isLoading={decisionMutation.isPending}
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
              {records.filter((r) => {
                if (filterTab === 'PENDING') return r.status === 'UNDER_INSPECTION';
                if (filterTab === 'APPROVED') return r.status === 'APPROVED' || r.status === 'PAID';
                if (filterTab === 'REJECTED') return r.status === 'REJECTED';
                return true;
              }).length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No consignments found in this tab.
                  </td>
                </tr>
              )}
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
