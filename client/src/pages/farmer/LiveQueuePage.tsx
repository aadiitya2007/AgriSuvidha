import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, API_BASE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Centre, QueueEntry } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { QrCodeModal } from '../../components/QrCodeModal';
import {
  Clock,
  Radio,
  Volume2,
  VolumeX,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  Users,
  QrCode,
} from 'lucide-react';

export const LiveQueuePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);
  const [selectedQrBooking, setSelectedQrBooking] = useState<any>(null);

  // Fetch Centres
  const { data: centres = [] } = useQuery<Centre[]>({
    queryKey: ['centres'],
    queryFn: () => apiRequest('/centres'),
  });

  useEffect(() => {
    if (!selectedCentreId && centres.length > 0) {
      setSelectedCentreId(centres[0].id);
    }
  }, [centres, selectedCentreId]);

  // Fetch Live Queue Data
  const { data: queueData, refetch } = useQuery<{
    centreId: string;
    activeToken: { tokenDisplay: string; id: string } | null;
    totalInQueue: number;
    waitingCount: number;
    entries: QueueEntry[];
  }>({
    queryKey: ['queue', selectedCentreId],
    queryFn: () => apiRequest(`/queue/${selectedCentreId}`),
    enabled: !!selectedCentreId,
    refetchInterval: 2000, // 2s fast real-time polling sync
  });

  // Server-Sent Events (SSE) Live Connection
  useEffect(() => {
    if (!selectedCentreId) return;

    const sseUrl = `${API_BASE}/queue/${selectedCentreId}/stream`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setSseConnected(true);
    };

    const handleUpdate = (e: MessageEvent) => {
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ queryKey: ['queue', selectedCentreId] });
      refetch();
      if (soundEnabled) {
        if ('speechSynthesis' in window) {
          try {
            const data = JSON.parse(e.data);
            if (data.calledToken) {
              const utterance = new SpeechSynthesisUtterance(`Token ${data.calledToken} called`);
              window.speechSynthesis.speak(utterance);
            }
          } catch (err) {}
        }
      }
    };

    eventSource.addEventListener('QUEUE_UPDATE', handleUpdate);
    eventSource.onmessage = handleUpdate;

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      eventSource.close();
      setSseConnected(false);
    };
  }, [selectedCentreId, queryClient, soundEnabled, refetch]);

  const currentCentre = centres.find((c) => c.id === selectedCentreId);
  const entries = queueData?.entries || [];

  // Farmer's own entry in queue if any
  const farmerEntry = entries.find((e) => e.farmerPhone === user?.phone);

  // Fetch farmer's active bookings for instant QR access
  const { data: userBookings = [] } = useQuery<any[]>({
    queryKey: ['my-bookings'],
    queryFn: () => apiRequest('/bookings/my-bookings'),
  });

  const centreBooking = userBookings.find(
    (b) =>
      (b.centreId === selectedCentreId || b.centre?.id === selectedCentreId) &&
      (b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'CHECKED_IN' || b.status === 'IN_INSPECTION')
  ) || userBookings[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header with Centre Switcher and SSE Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Live Mandi Queue Tracker
            <span
              className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                sseConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              <Radio className={`w-3 h-3 ${sseConnected ? 'text-emerald-600 animate-pulse' : 'text-amber-600'}`} />
              {sseConnected ? 'Real-Time SSE Live' : 'Polling Sync'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Automated weighbridge token broadcast. Token audio call-outs active.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Audio Alert On' : 'Audio Off'}</span>
          </button>

          <div className="w-56">
            <Select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="text-xs font-semibold"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Main Token Display Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Currently at Weighbridge */}
        <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center space-y-4 shadow-xl border-slate-700">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800">
            Currently on Weighbridge Scale
          </span>

          <div className="py-4">
            <p className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-emerald-400 animate-pulse">
              {queueData?.activeToken?.tokenDisplay || '---'}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Gate 2 • Scale Sensor Active
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Tractors in Yard</span>
              <span className="text-xl font-bold font-mono text-white">{queueData?.waitingCount || 0}</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Avg Turnaround</span>
              <span className="text-xl font-bold font-mono text-emerald-400">~12 mins</span>
            </div>
          </div>
        </Card>

        {/* Farmer's Position Card */}
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50/40 border-emerald-200 text-center space-y-4 shadow-sm flex flex-col justify-between">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            Your Status in Queue
          </span>

          {farmerEntry ? (
            <div className="space-y-3">
              <p className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-emerald-800">
                {farmerEntry.tokenDisplay}
              </p>
              <Badge variant={farmerEntry.status === 'CALLED' ? 'warning' : 'success'} className="text-xs font-bold">
                {farmerEntry.status === 'CALLED' ? '🚨 PLEASE PROCEED TO GATE 2!' : `Status: ${farmerEntry.status}`}
              </Badge>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">Farmers Ahead:</span>
                  <span className="text-2xl font-black font-mono text-slate-900">{farmerEntry.peopleAhead}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-slate-400 block text-[10px]">Estimated Wait:</span>
                  <span className="text-2xl font-black font-mono text-emerald-700">~{farmerEntry.estimatedWaitMinutes}m</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-3">
              <p className="text-slate-600 text-xs font-semibold">
                You do not have an active checked-in token at this centre.
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                When you arrive at the weighbridge gate, present your booking QR code or 6-digit OTP to get your queue token.
              </p>
              {centreBooking && (
                <Button
                  size="sm"
                  onClick={() => setSelectedQrBooking(centreBooking)}
                  className="mx-auto flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                >
                  <QrCode className="w-4 h-4" /> Show Entry QR & OTP
                </Button>
              )}
            </div>
          )}

          <p className="text-[11px] text-slate-400 pt-2 border-t border-emerald-100">
            {currentCentre?.name}: {currentCentre?.address}
          </p>
        </Card>
      </div>

      {/* Full Queue Roster Table */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Active Mandi Token Queue Roster ({entries.length} Vehicles)
          </h3>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
            Refresh Board
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3">Position</th>
                <th className="p-3">Token No</th>
                <th className="p-3">Farmer</th>
                <th className="p-3">Commodity</th>
                <th className="p-3">Est. Load</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Est. Wait</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Queue is clear. No waiting tractors in the yard.
                  </td>
                </tr>
              ) : (
                entries.map((item, idx) => {
                  const isCurrent = item.status === 'CALLED' || item.status === 'IN_INSPECTION';
                  const isUser = item.farmerPhone === user?.phone;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-amber-50/80 font-bold'
                          : isUser
                          ? 'bg-emerald-50/80 font-semibold'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3 font-mono text-slate-500">#{idx + 1}</td>
                      <td className="p-3 font-mono font-black text-slate-900 text-sm">
                        {item.tokenDisplay}
                      </td>
                      <td className="p-3 text-slate-800">
                        {item.farmerName} {isUser && <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded ml-1 font-bold">YOU</span>}
                      </td>
                      <td className="p-3">{item.commodityName}</td>
                      <td className="p-3 font-mono">{item.estimatedQuantity} Qtl</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            item.status === 'CALLED'
                              ? 'warning'
                              : item.status === 'IN_INSPECTION'
                              ? 'harvest'
                              : 'neutral'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">
                        {isCurrent ? 'Now Serving' : `~${item.estimatedWaitMinutes}m`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedQrBooking && (
        <QrCodeModal
          isOpen={!!selectedQrBooking}
          onClose={() => setSelectedQrBooking(null)}
          bookingReference={selectedQrBooking.bookingReference}
          qrPayload={selectedQrBooking.activeQr || selectedQrBooking.id}
          otpCode={selectedQrBooking.activeOtp || '123456'}
          centreName={selectedQrBooking.centre?.name || 'APMC Centre'}
          commodityName={selectedQrBooking.commodity?.name || 'Commodity'}
        />
      )}
    </div>
  );
};
