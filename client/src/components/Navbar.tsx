import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  Sprout,
  Calendar,
  MapPin,
  Clock,
  FileText,
  ShoppingBag,
  LifeBuoy,
  Bell,
  Menu,
  X,
  UserCheck,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const isStaff = user && user.role !== 'FARMER';

  const farmerNavLinks = [
    { label: t.nav.home, path: '/' },
    { label: t.nav.centres, path: '/centres' },
    { label: t.nav.bookSlot, path: '/book-slot' },
    { label: t.nav.liveQueue, path: '/queue' },
    { label: t.nav.procurement, path: '/procurements' },
    { label: t.nav.agriStore, path: '/store' },
    { label: t.nav.support, path: '/support' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[37px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="AgriSuvidha Logo"
                className="w-10 h-10 object-contain rounded-lg drop-shadow-xs"
              />
              <div>
                <span className="text-xl font-black tracking-tight text-emerald-900 flex items-center gap-1">
                  Agri<span className="text-amber-600">Suvidha</span>
                </span>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  एग्री-सुविधा • Innov8ors
                </span>
              </div>
            </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {farmerNavLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Controls: Notifications, Language, Staff Portal, Auth */}
          <div className="hidden sm:flex items-center gap-3">
            <LanguageSwitcher />

            {/* Notifications Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 relative transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-fadeIn">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-800">Notifications ({unreadCount} new)</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-xs text-emerald-600 hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-xs text-slate-400">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                              !n.isRead ? 'bg-emerald-50/60 font-medium' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-semibold text-slate-800">{n.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 leading-snug">{n.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Staff Portal Button if Operator/Manager/Admin */}
            {isStaff && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-all shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                Staff Portal
              </Link>
            )}

            {/* User Auth Action */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="max-w-[100px] truncate">{user?.profile?.fullName || 'Dashboard'}</span>
                </Link>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
              >
                {t.nav.login}
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center sm:hidden gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {farmerNavLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-medium ${
                location.pathname === link.path
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {isStaff && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-base font-bold bg-slate-900 text-amber-400 mt-2"
            >
              Staff Portal (Operator / Manager)
            </Link>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {isAuthenticated ? (
              <div className="flex items-center justify-between w-full">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-semibold text-emerald-800 text-sm"
                >
                  {user?.profile?.fullName || 'My Dashboard'}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-red-600 underline"
                >
                  {t.nav.logout}
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-emerald-600 text-white font-semibold rounded-lg text-sm"
              >
                {t.nav.login}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
