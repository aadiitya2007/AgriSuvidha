import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { Incident } from '../types';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const IncidentAlertBanner: React.FC = () => {
  const { data: incidents } = useQuery<Incident[]>({
    queryKey: ['active-incidents'],
    queryFn: () => apiRequest('/incidents?status=ACTIVE'),
    refetchInterval: 30000,
  });

  if (!Array.isArray(incidents) || incidents.length === 0 || !incidents[0]) {
    return null;
  }

  const first = incidents[0];
  const centreName = first.centre?.name || 'Mandi Centre';

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-semibold shadow-inner border-b border-amber-600">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="bg-amber-900 text-amber-100 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide animate-pulse">
            Active Notice
          </span>
          <AlertTriangle className="w-4 h-4 text-amber-950 flex-shrink-0" />
          <span className="truncate">
            <strong>{centreName}:</strong> {first.impactStatement}
          </span>
        </div>
        <Link
          to="/centres"
          className="flex-shrink-0 flex items-center gap-1 text-slate-950 hover:underline font-bold text-xs"
        >
          Check Centres <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
