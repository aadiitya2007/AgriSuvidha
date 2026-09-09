import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { Incident, Centre } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import {
  AlertTriangle,
  Plus,
  Radio,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  BellRing,
} from 'lucide-react';

export const IncidentCommandPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [updateText, setUpdateText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State
  const [centreId, setCentreId] = useState('');
  const [title, setTitle] = useState('');
  const [incidentType, setIncidentType] = useState('SERVER_OUTAGE');
  const [severity, setSeverity] = useState('HIGH');
  const [impactStatement, setImpactStatement] = useState('');
  const [pauseBookings, setPauseBookings] = useState(true);

  // Fetch Centres
  const { data: centres = [] } = useQuery<Centre[]>({
    queryKey: ['centres'],
    queryFn: () => apiRequest('/centres'),
  });

  // Fetch Incidents
  const { data: incidents = [], isLoading, refetch } = useQuery<Incident[]>({
    queryKey: ['admin-incidents'],
    queryFn: () => apiRequest('/incidents'),
  });

  // Report Mutation
  const reportMutation = useMutation({
    mutationFn: (payload: any) =>
      apiRequest('/incidents', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setStatusMessage(`Incident declared: ${data.title}. Targeted SMS & in-app alerts dispatched to affected farmers.`);
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['centres'] });
      setReportModalOpen(false);
      setTitle('');
      setImpactStatement('');
    },
  });

  // Add Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ incidentId, message, isResolved }: { incidentId: string; message: string; isResolved?: boolean }) =>
      apiRequest(`/incidents/${incidentId}/updates`, {
        method: 'POST',
        body: JSON.stringify({ message, isResolved }),
      }),
    onSuccess: (data) => {
      setStatusMessage(`Incident update published.`);
      queryClient.invalidateQueries({ queryKey: ['admin-incidents'] });
      queryClient.invalidateQueries({ queryKey: ['centres'] });
      setUpdateText('');
      setSelectedIncident(data);
    },
  });

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!centreId) {
      alert('Please select an affected centre');
      return;
    }
    reportMutation.mutate({
      centreId,
      title,
      incidentType,
      severity,
      impactStatement,
      pauseBookings,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
            Centre Outage & Logistics Incident Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Declare weighbridge scale outages, power drops, or highway logistics delays with automated farmer alerts.
          </p>
        </div>

        <Button
          variant="danger"
          onClick={() => setReportModalOpen(true)}
          className="text-xs font-bold flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" /> Declare Operational Incident
        </Button>
      </div>

      {statusMessage && <Alert variant="warning">{statusMessage}</Alert>}

      {/* Main Grid: Active Incidents & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Reported Incidents ({incidents.length})
          </h3>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading incidents...</div>
          ) : (
            incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const isActive = inc.status === 'ACTIVE' || inc.status === 'INVESTIGATING';

              return (
                <Card
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 cursor-pointer transition-all text-xs space-y-2 ${
                    isSelected
                      ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/40'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{inc.centre.name}</span>
                    <Badge variant={isActive ? 'danger' : 'success'}>
                      {inc.status}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-rose-900 leading-tight">{inc.title}</h4>
                  <p className="text-slate-600 line-clamp-2">{inc.impactStatement}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Severity: <strong className="text-slate-700">{inc.severity}</strong></span>
                    <span>{inc.affectedBookingsCount} farmers alerted</span>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Timeline & Resolution Box */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <Card className="flex flex-col h-[560px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedIncident.status === 'RESOLVED' ? 'success' : 'danger'}>
                      {selectedIncident.status}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900">{selectedIncident.centre.name}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1">{selectedIncident.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedIncident.impactStatement}</p>
                </div>

                {selectedIncident.status !== 'RESOLVED' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      updateMutation.mutate({
                        incidentId: selectedIncident.id,
                        message: 'Incident resolved. Systems tested and normal procurement resumed.',
                        isResolved: true,
                      })
                    }
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 font-bold"
                  >
                    Mark as Resolved &rarr;
                  </Button>
                )}
              </div>

              {/* Updates Timeline */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Official Resolution Timeline
                </span>
                {selectedIncident.updates?.map((u) => (
                  <div key={u.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Staff Log Update</span>
                      <span>{new Date(u.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-medium">{u.message}</p>
                  </div>
                ))}
              </div>

              {/* Post Update Box */}
              {selectedIncident.status !== 'RESOLVED' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!updateText.trim()) return;
                    updateMutation.mutate({ incidentId: selectedIncident.id, message: updateText });
                  }}
                  className="p-3 border-t border-slate-100 flex gap-2 bg-slate-50"
                >
                  <Input
                    placeholder="Broadcast an update to affected farmers & technicians..."
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    type="submit"
                    isLoading={updateMutation.isPending}
                    disabled={!updateText.trim()}
                    className="text-xs font-semibold px-4 flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Broadcast
                  </Button>
                </form>
              )}
            </Card>
          ) : (
            <Card className="h-[560px] flex items-center justify-center text-center p-8 text-slate-400 text-xs">
              Select an incident on the left to view timeline or declare a new incident above.
            </Card>
          )}
        </div>
      </div>

      {/* Declare Incident Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Declare Operational Incident / Outage"
        maxWidth="md"
      >
        <form onSubmit={handleReport} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Affected Procurement Centre</label>
            <Select value={centreId} onChange={(e) => setCentreId(e.target.value)} required>
              <option value="">-- Choose Mandi Centre --</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.district})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Incident Classification</label>
              <Select value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
                <option value="SERVER_OUTAGE">Server / NIC Connectivity Outage</option>
                <option value="CONNECTIVITY_ISSUE">Weighbridge Sensor Failure</option>
                <option value="POWER_OUTAGE">Power Outage / Generator Fault</option>
                <option value="LOGISTICS_DELAY">Highway Traffic / Freight Backlog</option>
                <option value="STAFF_SHORTAGE">Staff Shortage</option>
                <option value="EMERGENCY_CLOSURE">Emergency Mandi Closure</option>
              </Select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
              <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Warning to Farmers)</option>
                <option value="CRITICAL">Critical (Total Halt)</option>
              </Select>
            </div>
          </div>

          <Input
            label="Incident Title"
            placeholder="e.g. Weighbridge Scale 2 Network Disconnection"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Impact Statement (Sent to Farmers via SMS)</label>
            <textarea
              rows={3}
              value={impactStatement}
              onChange={(e) => setImpactStatement(e.target.value)}
              placeholder="Electronic scales offline. Intake running at 50%. You may reschedule without penalty."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            ></textarea>
          </div>

          <div className="flex items-center gap-2 p-3 bg-rose-50 rounded-xl border border-rose-200">
            <input
              type="checkbox"
              id="pauseBookings"
              checked={pauseBookings}
              onChange={(e) => setPauseBookings(e.target.checked)}
              className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
            />
            <label htmlFor="pauseBookings" className="text-rose-900 font-semibold text-xs leading-tight">
              Automatically pause new slot bookings for this centre until resolved.
            </label>
          </div>

          <Button type="submit" isLoading={reportMutation.isPending} variant="danger" className="w-full font-bold">
            Declare Incident & Dispatch Emergency Broadcast &rarr;
          </Button>
        </form>
      </Modal>
    </div>
  );
};
