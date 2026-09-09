import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../services/api';
import { Centre } from '../../types';
import { CentreMap } from '../../components/CentreMap';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Scale,
  Search,
  Navigation,
  AlertTriangle,
  Calendar,
  List,
  Map as MapIcon,
  Phone,
  CheckCircle2,
} from 'lucide-react';

export const CentreDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [district, setDistrict] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [warningModalCentre, setWarningModalCentre] = useState<Centre | null>(null);

  // Fetch centres with filters
  const { data: centres = [], isLoading } = useQuery<Centre[]>({
    queryKey: ['centres', district, search, selectedCommodity],
    queryFn: () => {
      const params = new URLSearchParams();
      if (district) params.append('district', district);
      if (search) params.append('search', search);
      if (selectedCommodity) params.append('commodityId', selectedCommodity);
      return apiRequest(`/centres?${params.toString()}`);
    },
  });

  const handleBookSlotClick = (centre: Centre) => {
    // If centre has outage, show warning modal first
    if (centre.operationalStatus !== 'OPERATIONAL' || (centre.activeIncidents && centre.activeIncidents.length > 0)) {
      setWarningModalCentre(centre);
    } else {
      navigate(`/book-slot?centreId=${centre.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Procurement Centres & APMC Yards
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Find nearby government-authorized collection points, check live queue status and operating hours.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" /> Interactive Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Directory List
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <Input
              placeholder="Search by centre name, APMC code or area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div>
            <Select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">All Districts (सभी जिले)</option>
              <option value="Nagpur">Nagpur (नागपुर)</option>
              <option value="Nashik">Nashik (नासिक)</option>
              <option value="Amravati">Amravati (अमरावती)</option>
              <option value="Pune">Pune (पुणे)</option>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">
              Found <strong>{centres.length}</strong> centres
            </span>
            {(district || search || selectedCommodity) && (
              <button
                onClick={() => { setDistrict(''); setSearch(''); setSelectedCommodity(''); }}
                className="text-emerald-600 hover:underline font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* View Content */}
      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CentreMap centres={centres} />
          </div>

          {/* Quick list on side */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {centres.map((c) => (
              <Card
                key={c.id}
                className="p-4 hover:border-emerald-500 hover:shadow-xs transition-all space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                    <p className="text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {c.address}
                    </p>
                  </div>
                  <Badge variant={c.operationalStatus === 'OPERATIONAL' ? 'success' : 'warning'}>
                    {c.operationalStatus}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <span><strong>Queue:</strong> {c.activeQueueCount || 0} waiting</span>
                  <span><strong>Capacity:</strong> {c.dailyCapacity}/day</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleBookSlotClick(c)}
                  >
                    Book Slot
                  </Button>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center font-medium"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {centres.map((c) => (
            <Card key={c.id} className="hover:border-emerald-500 transition-all">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant={c.operationalStatus === 'OPERATIONAL' ? 'success' : 'warning'} className="mb-2">
                      {c.operationalStatus}
                    </Badge>
                    <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      {c.address}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {c.code}
                  </span>
                </div>

                {c.statusNotice && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{c.statusNotice}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 block">Working Hours:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {c.operatingHours}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Live Queue Status:</span>
                    <span className="font-bold text-emerald-700 block mt-0.5">
                      {c.activeQueueCount || 0} farmers in yard
                    </span>
                  </div>
                </div>

                {/* Accepted Commodities */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 uppercase">Accepted Commodities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {c.commodities?.map((cm) => (
                      <span key={cm.id} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-medium">
                        {cm.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <Button
                    className="flex-1 text-xs font-bold"
                    onClick={() => handleBookSlotClick(c)}
                  >
                    Book Procurement Slot
                  </Button>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" /> Directions
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Outage Warning Modal */}
      {warningModalCentre && (
        <Modal
          isOpen={!!warningModalCentre}
          onClose={() => setWarningModalCentre(null)}
          title="Operational Notice"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-950 text-sm">{warningModalCentre.name} Notice</h4>
                <p className="text-amber-900 leading-relaxed">
                  {warningModalCentre.statusNotice || 'This centre is currently operating under limited capacity or undergoing maintenance.'}
                </p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              You can still view available slots for upcoming dates, or choose an alternate operational centre nearby to guarantee zero wait time.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setWarningModalCentre(null)}>
                Choose Alternate Centre
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const id = warningModalCentre.id;
                  setWarningModalCentre(null);
                  navigate(`/book-slot?centreId=${id}`);
                }}
              >
                Proceed to Bookings
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
