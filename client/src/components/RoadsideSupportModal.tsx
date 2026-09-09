import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useLanguage } from '../context/LanguageContext';
import {
  Wrench,
  Phone,
  Truck,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Navigation,
} from 'lucide-react';

interface RoadsideSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  centreName?: string;
}

export const RoadsideSupportModal: React.FC<RoadsideSupportModalProps> = ({
  isOpen,
  onClose,
  centreName = 'Nagpur Central APMC',
}) => {
  const { t } = useLanguage();
  const [vehicleNo, setVehicleNo] = useState('');
  const [issueType, setIssueType] = useState('Tractor Engine / Puncture');
  const [locationSent, setLocationSent] = useState(false);
  const [reported, setReported] = useState(false);

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReported(true);
    setTimeout(() => {
      setReported(false);
      onClose();
    }, 4000);
  };

  const handleShareGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationSent(true);
          setTimeout(() => setLocationSent(false), 3000);
        },
        () => {
          // Simulated coordinates for demo
          setLocationSent(true);
          setTimeout(() => setLocationSent(false), 3000);
        }
      );
    } else {
      setLocationSent(true);
      setTimeout(() => setLocationSent(false), 3000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kisan Roadside Assistance & Breakdown Helpline" maxWidth="md">
      <div className="space-y-5 text-xs text-slate-700">
        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <Wrench className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              En-Route Tractor & Vehicle Emergency Support
            </h4>
            <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
              If your tractor, trolley, or truck breaks down on the highway while traveling to {centreName}, contact our authorized quick-response mechanical team immediately.
            </p>
          </div>
        </div>

        {/* 1-Tap Emergency Call Contacts */}
        <div className="space-y-2">
          <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px] block">
            Direct Helpline Contacts
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href="tel:18001801551"
              className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 flex items-center gap-2.5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">National Kisan Helpline</span>
                <span className="font-bold font-mono text-slate-900 text-xs group-hover:text-emerald-800">1800-180-1551 (Toll-Free)</span>
              </div>
            </a>

            <a
              href="tel:9820123456"
              className="p-3 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-200 flex items-center gap-2.5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-sky-700 font-bold block uppercase">Mandi Mobile Mechanic</span>
                <span className="font-bold font-mono text-slate-900 text-xs group-hover:text-sky-800">+91 98201 23456</span>
              </div>
            </a>
          </div>
        </div>

        {/* Breakdown SOS Dispatch Form */}
        <form onSubmit={handleReport} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Dispatch Mobile Repair Unit / Towing
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vehicle / Tractor Number</label>
              <Input
                placeholder="e.g. MH-31-AB-1234"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                required
                className="text-xs font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Issue Encountered</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Tractor Engine / Puncture">Tractor Engine / Tire Puncture</option>
                <option value="Axle / Trolley Breakdown">Trolley Axle / Hitch Issue</option>
                <option value="Overheating / Radiator">Overheating / Fuel Run-out</option>
                <option value="Road Accident / Traffic Jam">Traffic Jam / Need Slot Hold</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleShareGPS}
              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                locationSent
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {locationSent ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> GPS Location Shared!
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Share Live Highway GPS
                </>
              )}
            </button>

            <Button type="submit" variant="primary" className="w-full sm:w-auto font-bold text-xs">
              Request Emergency Dispatch
            </Button>
          </div>

          {reported && (
            <div className="p-3 bg-emerald-100/90 text-emerald-900 rounded-xl font-semibold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>
                SOS received! Mandi rescue van dispatched. Your procurement slot has been frozen for 2 hours to protect your turn.
              </span>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
};
