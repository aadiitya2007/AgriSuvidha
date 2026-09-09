import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Centre, Slot } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { QrCodeModal } from '../../components/QrCodeModal';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Truck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const SlotBookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedCentreId, setSelectedCentreId] = useState<string>(searchParams.get('centreId') || '');
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(40);
  const [vehicleType, setVehicleType] = useState<string>('Tractor Trolley');
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);
  const [showPassModal, setShowPassModal] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Centres
  const { data: centres = [] } = useQuery<Centre[]>({
    queryKey: ['centres'],
    queryFn: () => apiRequest('/centres'),
  });

  // Set default centre if not set
  useEffect(() => {
    if (!selectedCentreId && centres.length > 0) {
      setSelectedCentreId(centres[0].id);
    }
  }, [centres, selectedCentreId]);

  // Current Centre Object
  const currentCentre = centres.find((c) => c.id === selectedCentreId);

  // Set default commodity when centre changes
  useEffect(() => {
    if (currentCentre && currentCentre.commodities && currentCentre.commodities.length > 0) {
      if (!selectedCommodityId || !currentCentre.commodities.some((c) => c.id === selectedCommodityId)) {
        setSelectedCommodityId(currentCentre.commodities[0].id);
      }
    }
  }, [currentCentre, selectedCommodityId]);

  // Fetch Slots for Centre + Commodity + Date
  const { data: slotData, isLoading: loadingSlots } = useQuery<{ centre: any; slots: Slot[] }>({
    queryKey: ['slots', selectedCentreId, selectedCommodityId, selectedDate],
    queryFn: () =>
      apiRequest(`/bookings/slots?centreId=${selectedCentreId}&commodityId=${selectedCommodityId}&date=${selectedDate}`),
    enabled: !!selectedCentreId && !!selectedCommodityId && !!selectedDate,
  });

  const slots = slotData?.slots || [];
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  // Book Mutation
  const bookingMutation = useMutation({
    mutationFn: (payload: any) =>
      apiRequest('/bookings', {
        method: 'POST',
        headers: {
          'Idempotency-Key': `idemp-bk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        },
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setCreatedBooking(data);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to confirm booking slot.');
    },
  });

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedSlotId) {
      setError('Please select an available time slot.');
      return;
    }

    bookingMutation.mutate({
      centreId: selectedCentreId,
      commodityId: selectedCommodityId,
      slotId: selectedSlotId,
      estimatedQuantity: Number(quantity),
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Book Procurement Slot (खरीद स्लॉट बुक करें)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Select procurement yard, commodity, and convenient time window with guaranteed gate priority.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Booking Confirmation View */}
      {createdBooking ? (
        <Card className="p-8 border-emerald-300 bg-gradient-to-br from-emerald-50/50 to-white text-center space-y-6 shadow-md">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <Badge variant="success" className="text-xs uppercase font-bold">Booking Confirmed</Badge>
            <h2 className="text-2xl font-black text-slate-900">
              Your Procurement Slot is Secured!
            </h2>
            <p className="text-sm text-slate-600">
              Reference Number: <strong className="font-mono text-emerald-800">{createdBooking.bookingReference}</strong>
            </p>
          </div>

          <div className="max-w-md mx-auto bg-white p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Centre:</span>
              <span className="font-semibold text-slate-800">{createdBooking.centre?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Commodity:</span>
              <span className="font-semibold text-slate-800">{createdBooking.commodity?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date & Time:</span>
              <span className="font-bold text-emerald-800 font-mono">
                {createdBooking.slot?.slotDate} ({createdBooking.slot?.startTime} - {createdBooking.slot?.endTime})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Quantity:</span>
              <span className="font-semibold text-slate-800 font-mono">{createdBooking.estimatedQuantity} Quintals</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="flex items-center gap-2 font-bold bg-emerald-600 hover:bg-emerald-500"
              onClick={() => setShowPassModal(true)}
            >
              <QrCode className="w-5 h-5" /> View Digital Entry Pass
            </Button>
            <Link to="/queue">
              <Button size="lg" variant="outline">
                Track Live Queue &rarr;
              </Button>
            </Link>
          </div>

          <QrCodeModal
            isOpen={showPassModal}
            onClose={() => setShowPassModal(false)}
            bookingReference={createdBooking.bookingReference}
            qrPayload={createdBooking.signedQr || createdBooking.id}
            otpCode={createdBooking.otpCode}
            centreName={createdBooking.centre?.name || ''}
            commodityName={createdBooking.commodity?.name || ''}
          />
        </Card>
      ) : (
        /* Booking Wizard Form */
        <form onSubmit={handleConfirmBooking} className="space-y-6">
          {/* Step 1: Centre and Commodity */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Step 1: Choose Procurement Centre & Crop
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <Select
                  label="Select APMC Procurement Yard"
                  value={selectedCentreId}
                  onChange={(e) => setSelectedCentreId(e.target.value)}
                  required
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.district}) - {c.operationalStatus}
                    </option>
                  ))}
                </Select>
                {currentCentre && currentCentre.statusNotice && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {currentCentre.statusNotice}
                  </p>
                )}
              </div>

              <div>
                <Select
                  label="Commodity to Procure"
                  value={selectedCommodityId}
                  onChange={(e) => setSelectedCommodityId(e.target.value)}
                  required
                >
                  {currentCentre?.commodities?.map((cm) => (
                    <option key={cm.id} value={cm.id}>
                      {cm.name} (MSP: ₹{cm.minMspPrice}/{cm.unit})
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          {/* Step 2: Date & Slot Selection */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Step 2: Select Date & Time Slot
              </h3>
              <div className="w-full sm:w-48">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="text-xs"
                />
              </div>
            </div>

            {loadingSlots ? (
              <div className="p-8 text-center text-slate-400 text-xs">Checking live slot availability...</div>
            ) : slots.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
                No slots configured for this date and commodity. Please try tomorrow’s date.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {slots.map((s) => {
                  const isSelected = s.id === selectedSlotId;
                  const isFull = !s.isAvailable;
                  const percentBooked = Math.round((s.bookedCapacity / s.maxCapacity) * 100);

                  return (
                    <div
                      key={s.id}
                      onClick={() => !isFull && setSelectedSlotId(s.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-xs space-y-2 relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500'
                          : isFull
                          ? 'border-slate-200 bg-slate-100 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 hover:border-emerald-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {s.startTime}
                        </span>
                        <Badge variant={isFull ? 'danger' : isSelected ? 'success' : 'neutral'}>
                          {isFull ? 'Full' : `${s.remainingCapacity} Left`}
                        </Badge>
                      </div>

                      {/* Capacity Progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${percentBooked > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percentBooked}%` }}
                        ></div>
                      </div>

                      <span className="text-[10px] text-slate-500 block">
                        {s.bookedCapacity} / {s.maxCapacity} tractors booked
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Step 3: Vehicle & Quantity Details */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Step 3: Vehicle & Load Estimates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <Select
                  label="Vehicle Transport Type"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="Tractor Trolley">Tractor Trolley (ट्रैक्टर ट्रॉली)</option>
                  <option value="Mini Truck / Pickup">Pickup / 407 Truck (पिकअप)</option>
                  <option value="Heavy Truck">Heavy Truck (10/12 व्हीलर)</option>
                  <option value="Bullock Cart">Bullock Cart (बैलगाड़ी)</option>
                </Select>
              </div>

              <div>
                <Input
                  label="Estimated Harvest Quantity (Quintals)"
                  type="number"
                  min="1"
                  max="500"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value))}
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Standard APMC bag weighing tolerance: ±10% on arrival.
                </p>
              </div>
            </div>
          </Card>

          {/* Submit Action */}
          <Button
            type="submit"
            size="lg"
            isLoading={bookingMutation.isPending}
            disabled={!selectedSlotId}
            className="w-full text-base font-bold shadow-md"
          >
            Confirm Slot Booking & Generate Entry QR &rarr;
          </Button>
        </form>
      )}
    </div>
  );
};
