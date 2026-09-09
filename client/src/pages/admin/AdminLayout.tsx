import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import {
  LayoutDashboard,
  Users,
  Scale,
  CreditCard,
  AlertTriangle,
  ShoppingBag,
  LifeBuoy,
  Activity,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building,
  Menu,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, quickDemoLogin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  const role = user?.role || 'CENTRE_OPERATOR';

  // Role metadata for crystal-clear clarity
  const roleConfig = {
    CENTRE_OPERATOR: {
      title: 'Mandi Gate & Weighbridge Desk',
      badge: 'Operator Mode',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      centre: 'Nagpur APMC Hub • Gate 1 Weighbridge',
      primaryRoute: '/admin/queue',
      items: [
        { label: 'Live Queue & Weighbridge', path: '/admin/queue', icon: <Users className="w-4 h-4" />, isPrimary: true },
        { label: 'Agri Store Order Pickup', path: '/admin/orders', icon: <ShoppingBag className="w-4 h-4" /> },
        { label: 'Farmer Grievance Tickets', path: '/admin/tickets', icon: <LifeBuoy className="w-4 h-4" /> },
        { label: 'Incident Command Alerts', path: '/admin/incidents', icon: <AlertTriangle className="w-4 h-4" /> },
      ],
    },
    CENTRE_MANAGER: {
      title: 'APMC Centre General Manager Desk',
      badge: 'Manager Mode',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      centre: 'Nagpur APMC Procurement Centre',
      primaryRoute: '/admin/procurement',
      items: [
        { label: 'Inspection & Grading Approvals', path: '/admin/procurement', icon: <Scale className="w-4 h-4" />, isPrimary: true },
        { label: 'Payments & DBT Disbursal', path: '/admin/payments', icon: <CreditCard className="w-4 h-4" />, isPrimary: true },
        { label: 'Live Mandi Queue Overview', path: '/admin/queue', icon: <Users className="w-4 h-4" /> },
        { label: 'Incident Command Desk', path: '/admin/incidents', icon: <AlertTriangle className="w-4 h-4" /> },
        { label: 'Store Inventory Management', path: '/admin/orders', icon: <ShoppingBag className="w-4 h-4" /> },
        { label: 'Support & Grievances', path: '/admin/tickets', icon: <LifeBuoy className="w-4 h-4" /> },
      ],
    },
    PLATFORM_ADMIN: {
      title: 'State Agricultural Command Centre',
      badge: 'Director Mode',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      centre: 'Maharashtra State Procurement Command',
      primaryRoute: '/admin',
      items: [
        { label: 'Executive State Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, isPrimary: true },
        { label: 'State-wide Queue Operations', path: '/admin/queue', icon: <Users className="w-4 h-4" /> },
        { label: 'Crop Inspection & Grading', path: '/admin/procurement', icon: <Scale className="w-4 h-4" /> },
        { label: 'DBT Ledgers & PFMS Export', path: '/admin/payments', icon: <CreditCard className="w-4 h-4" /> },
        { label: 'Emergency Incident Broadcast', path: '/admin/incidents', icon: <AlertTriangle className="w-4 h-4" /> },
        { label: 'Seed & Fertilizer Inventory', path: '/admin/orders', icon: <ShoppingBag className="w-4 h-4" /> },
        { label: 'Grievance Resolution Inbox', path: '/admin/tickets', icon: <LifeBuoy className="w-4 h-4" /> },
        { label: 'Audit Logs & Security Health', path: '/admin/audit', icon: <Activity className="w-4 h-4" /> },
      ],
    },
  };

  const currentConfig = roleConfig[role as keyof typeof roleConfig] || roleConfig.CENTRE_OPERATOR;

  const handleQuickSwitch = async (targetRole: 'operator' | 'manager' | 'admin' | 'farmer1') => {
    setSwitchingRole(targetRole);
    try {
      await quickDemoLogin(targetRole);
      if (targetRole === 'operator') {
        navigate('/admin/queue');
      } else if (targetRole === 'manager') {
        navigate('/admin/procurement');
      } else if (targetRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } finally {
      setSwitchingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden bg-slate-900 text-white p-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-7 h-7 rounded-lg" />
          <span className="font-bold text-sm">AgriSuvidha Desk</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${currentConfig.badgeColor}`}>
            {currentConfig.badge}
          </span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-800"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileSidebarOpen ? 'block' : 'hidden'
        } md:flex w-full md:w-64 bg-slate-900 text-slate-300 flex-col justify-between p-4 shadow-xl z-20 flex-shrink-0`}
      >
        <div className="space-y-5">
          {/* Brand Header */}
          <div className="px-2 pt-2">
            <Link to="/" className="flex items-center gap-2.5 text-white font-bold text-lg">
              <img
                src="/logo.png"
                alt="AgriSuvidha Logo"
                className="w-8 h-8 object-contain rounded-lg"
              />
              <span>Agri<span className="text-amber-400">Suvidha</span> Desk</span>
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentConfig.badgeColor}`}>
                {currentConfig.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              📍 {user?.assignedCentres?.[0]?.centreName || currentConfig.centre}
            </p>
          </div>

          {/* Role-tailored Nav Items */}
          <nav className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
              Active Workspace
            </p>
            {currentConfig.items.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.isPrimary && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 py-0.2 rounded font-mono">
                      PRIMARY
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Quick Persona Switcher & User Profile */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
              Switch Role View:
            </p>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              <button
                onClick={() => handleQuickSwitch('operator')}
                disabled={!!switchingRole}
                className={`py-1 px-1 rounded font-semibold border text-center transition-all ${
                  role === 'CENTRE_OPERATOR'
                    ? 'bg-sky-600 text-white border-sky-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Operator
              </button>
              <button
                onClick={() => handleQuickSwitch('manager')}
                disabled={!!switchingRole}
                className={`py-1 px-1 rounded font-semibold border text-center transition-all ${
                  role === 'CENTRE_MANAGER'
                    ? 'bg-amber-600 text-white border-amber-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Manager
              </button>
              <button
                onClick={() => handleQuickSwitch('admin')}
                disabled={!!switchingRole}
                className={`py-1 px-1 rounded font-semibold border text-center transition-all ${
                  role === 'PLATFORM_ADMIN'
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <div className="px-2">
            <p className="text-xs font-bold text-white truncate">{user?.profile?.fullName || user?.email}</p>
            <p className="text-[10px] text-emerald-400 font-mono">🟢 Desk Active & Verified</p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/dashboard"
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs text-center font-bold transition-colors flex items-center justify-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Farmer App
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="py-1.5 px-3 bg-red-950 hover:bg-red-900 text-red-200 rounded-lg text-xs font-medium transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Staff Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dedicated Desktop Staff Top Bar */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-3 items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-base font-black text-slate-900">{currentConfig.title}</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium border-l border-slate-200 pl-3">
              {currentConfig.centre}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Logged in:</span>
              <span className="font-bold text-slate-800">{user?.profile?.fullName || user?.email}</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="text-xs text-red-600 hover:text-red-700 font-semibold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
