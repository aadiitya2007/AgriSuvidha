import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Booking } from '../types';
import { cancelBookingApi } from '../services/api';
import {
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess: () => void;
}

const CANCELLATION_REASONS = [
  'Harvest or threshing delayed due to weather',
  'Tractor / Transport vehicle breakdown or unavailable',
  'Field moisture / Rain risk - harvest not ready',
  'Selected wrong procurement centre or date by mistake',
  'Price disparity / Selling via alternative channel',
  'Personal or family emergency',
  'Other reason',
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!booking) return null;

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const fullReason =
        selectedReason === 'Other reason' && customNote.trim()
          ? `Other: ${customNote.trim()}`
          : selectedReason;

      await cancelBookingApi(booking.id, fullReason);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to cancel booking. Please try again or contact helpline 1800-180-1551.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Procurement Slot" maxWidth="md">
      <div className="p-6 space-y-5">
        {isSuccess ? (
          <div className="text-center py-6 space-y-3 animate-fadeIn">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Booking Successfully Cancelled</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your scheduled slot capacity has been released. You can book a new slot whenever your harvest is ready.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCancel} className="space-y-4">
            {/* Booking Summary Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Target Booking
                </span>
                <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {booking.bookingReference}
                </span>
              </div>

              <div className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>{booking.commodity.name}</span>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {booking.estimatedQuantity} Quintals
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{booking.centre?.name || 'Procurement Yard'} {booking.centre?.district ? `(${booking.centre.district})` : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-emerald-800 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{booking.slot.slotDate} | {booking.slot.startTime}</span>
                </div>
              </div>
            </div>

            {/* Mandi Cut-off Policy Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px] uppercase tracking-wide text-amber-800">
                  2-Hour Cut-off Policy
                </p>
                <p className="text-[11px] text-amber-700/90 mt-0.5 leading-relaxed">
                  Bookings can only be cancelled up to <strong>2 hours prior</strong> to the slot start. Cancellations within 2 hours are locked to avoid empty weighbridges and mandi traffic disruption.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none bg-white font-medium text-slate-800"
              >
                {CANCELLATION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Notes if Other */}
            {selectedReason === 'Other reason' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-semibold text-slate-600 block">
                  Please describe briefly
                </label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Transport tyre puncture near highway..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-slate-800 resize-none"
                />
              </div>
            )}

            {/* Release Warning */}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Upon cancellation, this slot capacity will be made available to other farmers waiting in the queue.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="text-xs font-semibold"
              >
                Keep Booking
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>Cancelling...</>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Confirm Cancellation
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
