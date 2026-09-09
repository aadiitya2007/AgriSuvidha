import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Scale,
  CreditCard,
  AlertTriangle,
  ShoppingBag,
  LifeBuoy,
  FileText,
  Activity,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Executive Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Queue & Weighbridge', path: '/admin/queue', icon: <Users className="w-4 h-4" /> },
    { label: 'Inspection & Grading', path: '/admin/procurement', icon: <Scale className="w-4 h-4" /> },
    { label: 'Payments & Ledgers', path: '/admin/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Incident Command', path: '/admin/incidents', icon: <AlertTriangle className="w-4 h-4" /> },
    { label: 'Inventory & Orders', path: '/admin/orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { label: 'Support & Grievances', path: '/admin/tickets', icon: <LifeBuoy className="w-4 h-4" /> },
    { label: 'Audit Logs & Health', path: '/admin/audit', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 shadow-xl z-20 flex-shrink-0">
        <div className="space-y-6">
          {/* Brand */}
          <div className="px-2 pt-2">
            <Link to="/" className="flex items-center gap-2.5 text-white font-bold text-lg">
              <img
                src="/logo.png"
                alt="AgriSuvidha Logo"
                className="w-8 h-8 object-contain rounded-lg"
              />
              <span>Agri<span className="text-amber-400">Suvidha</span> Desk</span>
            </Link>
            <span className="text-[10px] text-emerald-400 font-mono block mt-1 uppercase tracking-wider">
              {user?.role} Portal • Team Innov8ors
            </span>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="px-2">
            <p className="text-xs font-bold text-white truncate">{user?.email || user?.phone}</p>
            <p className="text-[10px] text-slate-400 truncate">
              {user?.assignedCentres?.[0]?.centreName || 'Global Access'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/dashboard"
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs text-center font-medium transition-colors"
            >
              Farmer View
            </Link>
            <button
              onClick={logout}
              className="py-1.5 px-2 bg-red-950 hover:bg-red-900 text-red-200 rounded-lg text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
};
