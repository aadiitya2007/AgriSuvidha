import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Centre, QueueEntry } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { QrScannerModal } from '../../components/QrScannerModal';
import {
  Users,
  Camera,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  RotateCw,
} from 'lucide-react';

export const LiveQueueOperationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCentreId, setSelectedCentreId] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch Centres
  const { data: centres = [] } = useQuery<Centre[]>({
    queryKey: ['centres'],
    queryFn: () => apiRequest('/centres'),
  });

  const assigned = (user as any)?.assignedCentres?.[0]?.centreId || (user as any)?.staffAssignments?.[0]?.centreId;
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  React.useEffect(() => {
    if (assigned && (!selectedCentreId || !isPlatformAdmin)) {
      setSelectedCentreId(assigned);
    } else if (!selectedCentreId && centres.length > 0) {
      setSelectedCentreId(centres[0].id);
    }
  }, [centres, user, assigned, isPlatformAdmin]);

  const visibleCentres = isPlatformAdmin || !assigned
    ? centres
    : centres.filter((c) => c.id === assigned);

  // Fetch Queue Entries
  const { data: queueData, refetch } = useQuery<{
    centreId: string;
    activeToken: { tokenDisplay: string; id: string } | null;
    totalInQueue: number;
    waitingCount: number;
    entries: QueueEntry[];
  }>({
    queryKey: ['admin-queue', selectedCentreId],
    queryFn: () => apiRequest(`/queue/${selectedCentreId}`),
    enabled: !!selectedCentreId,
    refetchInterval: 5000,
  });

  // Call Next Token Mutation
  const callNextMutation = useMutation({
    mutationFn: (centreId: string) =>
      apiRequest('/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ centreId }),
      }),
    onSuccess: (data) => {
      setStatusMessage(`Called Token ${data.tokenDisplay} to Weighbridge Gate!`);
      queryClient.invalidateQueries({ queryKey: ['admin-queue', selectedCentreId] });
      setTimeout(() => setStatusMessage(null), 4000);
    },
    onError: (err: any) => {
      setStatusMessage(`Error: ${err.message}`);
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ entryId, status }: { entryId: string; status: string }) =>
      apiRequest('/queue/status', {
        method: 'POST',
        body: JSON.stringify({ entryId, status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queue', selectedCentreId] });
    },
  });

  const entries = queueData?.entries || [];
  const activeToken = queueData?.activeToken;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-emerald-600" />
            Weighbridge Queue Control Desk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Direct token call-outs, fast QR gate check-ins, and live weighing queue sequencing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-2 text-xs font-bold shadow-md bg-emerald-600 hover:bg-emerald-700"
          >
            <Camera className="w-4 h-4" /> Scan Farmer QR / OTP
          </Button>

          <div className="w-56">
            <Select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="text-xs font-semibold"
            >
              {visibleCentres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {statusMessage && <Alert variant="success">{statusMessage}</Alert>}

      {/* Action Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Token Call Out Card */}
        <Card className="p-6 bg-slate-900 text-white space-y-4 shadow-lg md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Active Vehicle at Weighbridge
            </span>
            <span className="text-xs text-slate-400">
              Waiting in yard: <strong>{queueData?.waitingCount || 0}</strong> tractors
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div>
              <p className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-emerald-400">
                {activeToken?.tokenDisplay || 'NO TOKEN CALLED'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Scale Sensor 1 Online</p>
            </div>

            <Button
              size="lg"
              onClick={() => callNextMutation.mutate(selectedCentreId)}
              isLoading={callNextMutation.isPending}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2 shadow-lg w-full sm:w-auto"
            >
              <Megaphone className="w-5 h-5" /> Call Next Token &rarr;
            </Button>
          </div>
        </Card>

        {/* Quick Check-in Info */}
        <Card className="p-6 bg-white space-y-3 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Gate Arrival Instructions
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            When a farmer arrives at the APMC gate, click <strong>'Scan Farmer QR / OTP'</strong> to read their signed entry pass and generate their sequential token.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-mono">
            Demo Farmer OTP: <strong>123456</strong>
          </div>
        </Card>
      </div>

      {/* Queue Table */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Yard Queue Roster ({entries.length} Entries)
          </h3>
          <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
            <RotateCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3.5">Token</th>
                <th className="p-3.5">Farmer Name</th>
                <th className="p-3.5">Mobile</th>
                <th className="p-3.5">Commodity</th>
                <th className="p-3.5">Est. Weight</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Operator Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No active tokens in queue.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-black text-sm text-slate-900">
                      {item.tokenDisplay}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{item.farmerName}</td>
                    <td className="p-3.5 font-mono text-slate-500">{item.farmerPhone}</td>
                    <td className="p-3.5 font-medium">{item.commodityName}</td>
                    <td className="p-3.5 font-mono">{item.estimatedQuantity} Qtl</td>
                    <td className="p-3.5">
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
                    <td className="p-3.5 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStatusMutation.mutate({ entryId: item.id, status: 'SERVED' })
                        }
                        className="text-[11px] text-emerald-700 hover:bg-emerald-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateStatusMutation.mutate({ entryId: item.id, status: 'NO_SHOW' })
                        }
                        className="text-[11px] text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1 inline" /> No-Show
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* QR Scanner / OTP Modal */}
      {scannerOpen && (
        <QrScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          centreId={selectedCentreId}
          onVerified={(data) => {
            const token = data?.queueToken || (data?.order?.orderNumber ? `ORD-${data.order.orderNumber}` : 'TK-001');
            const farmer = data?.booking?.farmerName || data?.order?.farmerName || 'Farmer';
            const ref = data?.booking?.reference || data?.order?.orderNumber || 'Pass';
            setStatusMessage(`✅ Gate Check-In Verified for ${farmer} (${ref})! Allocated Token ${token} to Weighbridge.`);
            queryClient.invalidateQueries({ queryKey: ['admin-queue', selectedCentreId] });
            setTimeout(() => setStatusMessage(null), 6000);
          }}
        />
      )}
    </div>
  );
};
