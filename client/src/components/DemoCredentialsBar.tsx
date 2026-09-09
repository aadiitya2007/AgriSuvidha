import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, ChevronDown, ChevronUp, ShieldCheck, Check } from 'lucide-react';

export const DemoCredentialsBar: React.FC = () => {
  const { user, quickDemoLogin, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-slate-200 text-xs border-b border-emerald-800/40 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-400 tracking-wide">AgriSuvidha (SIH26032 - Team Innov8ors):</span>
          {user ? (
            <span className="bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {user.role} ({user.profile?.fullName || user.email || user.phone})
            </span>
          ) : (
            <span className="text-slate-400">Guest Visitor</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden sm:inline">1-Click Demo Login:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => quickDemoLogin('farmer1')}
              className="bg-emerald-700/80 hover:bg-emerald-600 text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm"
              title="Farmer Rameshwar Patil (In Nagpur Queue)"
            >
              🌾 Farmer (In Queue)
            </button>
            <button
              onClick={() => quickDemoLogin('farmer2')}
              className="bg-emerald-800/80 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm"
              title="Farmer Suresh Deshmukh (Waiting)"
            >
              🌾 Farmer 2
            </button>
            <button
              onClick={() => quickDemoLogin('operator')}
              className="bg-sky-700/80 hover:bg-sky-600 text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm"
              title="Centre Operator (Nagpur APMC)"
            >
              🔍 Operator
            </button>
            <button
              onClick={() => quickDemoLogin('manager')}
              className="bg-amber-700/80 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm"
              title="Centre Manager (Approval & Payments)"
            >
              💼 Manager
            </button>
            <button
              onClick={() => quickDemoLogin('admin')}
              className="bg-purple-700/80 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm"
              title="Platform Administrator"
            >
              ⚙️ Admin
            </button>
            {user && (
              <button
                onClick={logout}
                className="bg-red-900/60 hover:bg-red-800 text-red-200 px-2 py-1 rounded text-xs transition-all"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
