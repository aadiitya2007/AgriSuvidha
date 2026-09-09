import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, User, ChevronDown, ChevronUp, ShieldCheck, Check } from 'lucide-react';

export const DemoCredentialsBar: React.FC = () => {
  const { user, quickDemoLogin, logout } = useAuth();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const [operatorMenuOpen, setOperatorMenuOpen] = useState(false);
  const [managerMenuOpen, setManagerMenuOpen] = useState(false);

  const handleRoleSwitch = async (role: string) => {
    setLoadingRole(role);
    setOperatorMenuOpen(false);
    setManagerMenuOpen(false);
    try {
      await quickDemoLogin(role);
      if (role.startsWith('operator')) {
        navigate('/admin/queue');
      } else if (role.startsWith('manager')) {
        navigate('/admin/procurement');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } finally {
      setLoadingRole(null);
    }
  };

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
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleRoleSwitch('farmer1')}
              disabled={!!loadingRole}
              className="bg-emerald-700/80 hover:bg-emerald-600 text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Farmer Rameshwar Patil (In Nagpur Queue)"
            >
              {loadingRole === 'farmer1' ? 'Switching...' : '🌾 Farmer (In Queue)'}
            </button>
            <button
              onClick={() => handleRoleSwitch('farmer2')}
              disabled={!!loadingRole}
              className="bg-emerald-800/80 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Farmer Suresh Deshmukh (Waiting)"
            >
              {loadingRole === 'farmer2' ? 'Switching...' : '🌾 Farmer 2'}
            </button>

            {/* Operator Regional Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setOperatorMenuOpen(!operatorMenuOpen);
                  setManagerMenuOpen(false);
                }}
                disabled={!!loadingRole}
                className="bg-sky-700/90 hover:bg-sky-600 text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-1"
                title="Mandi Gate Operators for Nagpur, Nashik, Amravati, Pune"
              >
                <span>🔍 {loadingRole?.startsWith('operator') ? 'Switching...' : 'Operator'}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
              {operatorMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-sky-600/60 rounded-xl shadow-2xl py-1 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-sky-400 border-b border-slate-800">
                    Select Operator Region
                  </div>
                  {[
                    { key: 'operator-nagpur', label: 'Nagpur APMC Hub', code: 'APMC-NGP-01' },
                    { key: 'operator-nashik', label: 'Nashik Onion Yard', code: 'APMC-NSK-02' },
                    { key: 'operator-amravati', label: 'Amravati Cotton Terminal', code: 'APMC-AMR-03' },
                    { key: 'operator-pune', label: 'Pune Kisan Centre', code: 'APMC-PUN-04' },
                  ].map((r) => (
                    <button
                      key={r.key}
                      onClick={() => handleRoleSwitch(r.key)}
                      className="w-full text-left px-3 py-2 hover:bg-sky-950/90 text-slate-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-medium">{r.label}</span>
                      <span className="text-[10px] text-sky-400 font-mono">{r.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manager Regional Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setManagerMenuOpen(!managerMenuOpen);
                  setOperatorMenuOpen(false);
                }}
                disabled={!!loadingRole}
                className="bg-amber-700/90 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-1"
                title="Centre Managers for Inspection & DBT Approvals"
              >
                <span>💼 {loadingRole?.startsWith('manager') ? 'Switching...' : 'Manager'}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>
              {managerMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-amber-600/60 rounded-xl shadow-2xl py-1 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-amber-400 border-b border-slate-800">
                    Select Manager Region
                  </div>
                  {[
                    { key: 'manager-nagpur', label: 'Nagpur Central APMC', code: 'APMC-NGP-01' },
                    { key: 'manager-nashik', label: 'Nashik Onion Yard', code: 'APMC-NSK-02' },
                    { key: 'manager-amravati', label: 'Amravati Cotton Terminal', code: 'APMC-AMR-03' },
                    { key: 'manager-pune', label: 'Pune Kisan Centre', code: 'APMC-PUN-04' },
                  ].map((r) => (
                    <button
                      key={r.key}
                      onClick={() => handleRoleSwitch(r.key)}
                      className="w-full text-left px-3 py-2 hover:bg-amber-950/90 text-slate-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-medium">{r.label}</span>
                      <span className="text-[10px] text-amber-400 font-mono">{r.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleRoleSwitch('admin')}
              disabled={!!loadingRole}
              className="bg-purple-700/80 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="State Administrator (Executive Dashboard & Audit)"
            >
              {loadingRole === 'admin' ? 'Switching...' : '⚙️ Admin Portal'}
            </button>
            {user && (
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
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
