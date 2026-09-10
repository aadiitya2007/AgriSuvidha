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
  ChevronRight,
  ShieldCheck,
  Home,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead, showToast } = useNotifications();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const isStaff = user && user.role !== 'FARMER';

  // Links for the slide-out drawer (keeping top bar clean)
  const drawerLinks = [
    { label: t.nav.home, path: '/', icon: <Home className="w-4 h-4 text-emerald-600" /> },
    { label: t.nav.centres, path: '/centres', icon: <MapPin className="w-4 h-4 text-sky-600" /> },
    { label: t.nav.bookSlot, path: '/book-slot', icon: <Calendar className="w-4 h-4 text-emerald-600" /> },
    { label: t.nav.liveQueue, path: '/queue', icon: <Clock className="w-4 h-4 text-amber-600" /> },
    { label: t.nav.procurement, path: '/procurements', icon: <FileText className="w-4 h-4 text-purple-600" /> },
    { label: t.nav.agriStore, path: '/store', icon: <ShoppingBag className="w-4 h-4 text-emerald-600" /> },
    { label: t.nav.support, path: '/support', icon: <LifeBuoy className="w-4 h-4 text-rose-600" /> },
  ];

  return (
    <>
      <nav className="bg-white border-b border-slate-200 sticky top-[37px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 1. Brand & Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="AgriSuvidha Logo"
                className="w-10 h-10 object-contain rounded-xl drop-shadow-xs group-hover:scale-105 transition-transform"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-emerald-900">
                    Agri<span className="text-amber-600">Suvidha</span>
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300">
                    SIH26032
                  </span>
                </div>
                <span className="block text-[10px] font-semibold text-slate-500 tracking-wide">
                  स्मार्ट शेतकरी खरेदी मंच • Team Innov8ors
                </span>
              </div>
            </Link>

            {/* 2. Centre Status / Quick Action Badge (Clean & Uncluttered) */}
            <div className="hidden md:flex items-center gap-2">
              {isStaff ? (
                <Link
                  to={user.role === 'CENTRE_OPERATOR' ? '/admin/queue' : user.role === 'CENTRE_MANAGER' ? '/admin/procurement' : '/admin'}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-amber-300 rounded-full text-xs font-bold hover:bg-slate-800 transition-all shadow-xs border border-amber-400/40"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Open Staff Portal ({user.role === 'CENTRE_OPERATOR' ? 'Operator' : user.role === 'CENTRE_MANAGER' ? 'Manager' : 'Admin'}) →</span>
                </Link>
              ) : isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    🌾 शेतकरी पोर्टल (Kisan Suvidha)
                  </span>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    My Dashboard
                  </Link>
                </div>
              ) : (
                <span className="bg-slate-50 text-slate-600 text-xs font-medium px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Govt MSP Farmer Procurement Platform
                </span>
              )}
            </div>

            {/* 3. Right Controls: Language Switcher, Sound Notifications, User Profile & Menu Drawer */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Notifications Bell */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                    className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 relative transition-colors"
                    aria-label="Notifications"
                    title="Alerts & Notification Audio"
                  >
                    <Bell className="w-5 h-5 text-slate-700" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-fadeIn">
                      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Bell className="w-4 h-4 text-emerald-600" />
                          <h4 className="font-bold text-sm text-slate-800">Alerts ({unreadCount} new)</h4>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-emerald-600 hover:underline font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="px-3 pt-2 pb-1.5 border-b border-slate-100 bg-slate-50/70">
                        <button
                          onClick={() => {
                            setNotifDropdownOpen(false);
                            showToast({
                              title: 'DBT Payment Disbursed: ₹48,500',
                              body: 'Direct Benefit Transfer of ₹48,500 successfully transferred to State Bank of India A/C ****4821. UTR: SBIN26253901928.',
                              category: 'PAYMENT',
                              actionUrl: '/procurements',
                            });
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 rounded-lg flex items-center justify-between border border-emerald-300 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '3s' }} />
                            Test DBT Payment Pop-up
                          </span>
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-mono font-semibold">Demo</span>
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-center text-xs text-slate-400">No new alerts.</p>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markAsRead(n.id);
                                showToast({
                                  id: n.id,
                                  title: n.title,
                                  body: n.body,
                                  category: n.category,
                                  actionUrl: n.actionUrl,
                                });
                              }}
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

              {/* User Profile Pill */}
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="max-w-[110px] truncate">{user?.profile?.fullName || user?.phone || 'Farmer'}</span>
                  </Link>
                  <button
                    onClick={logout}
                    title="Sign out"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all"
                >
                  {t.nav.login}
                </Link>
              )}

              {/* Slide-out Drawer Hamburger Button */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
                aria-label="Open Navigation Drawer"
                title="Explore Services"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Staff Jump Banner if an Operator or Manager is viewing a public page */}
      {isStaff && (
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-amber-300 text-xs px-4 py-2 border-b border-amber-600/30 flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Logged in as {user.role === 'CENTRE_OPERATOR' ? 'Gate Operator' : user.role === 'CENTRE_MANAGER' ? 'Centre Manager' : 'Admin'} ({user.profile?.fullName || user.email})
            </span>
            <Link
              to={user.role === 'CENTRE_OPERATOR' ? '/admin/queue' : user.role === 'CENTRE_MANAGER' ? '/admin/procurement' : '/admin'}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition-all shadow-xs"
            >
              Go to Staff Operations Portal →
            </Link>
          </div>
        </div>
      )}

      {/* Slide-out Navigation Drawer (Clean, elegant, non-intrusive) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col justify-between p-6 animate-slideLeft">
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg" />
                    <div>
                      <h3 className="font-black text-slate-900 text-base">AgriSuvidha</h3>
                      <p className="text-[10px] text-slate-500 font-semibold">Explore Kisan Services</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                    Farmer Portals & Services
                  </p>
                  {drawerLinks.map((link) => {
                    const active = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                          active
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {link.icon}
                          <span>{link.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                    );
                  })}
                </div>

                {/* Staff Jump Link in Drawer */}
                {isStaff && (
                  <div className="pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 px-2 mb-2">
                      Mandi Staff Console
                    </p>
                    <Link
                      to={user.role === 'CENTRE_OPERATOR' ? '/admin/queue' : user.role === 'CENTRE_MANAGER' ? '/admin/procurement' : '/admin'}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-between p-3 bg-slate-900 text-amber-300 rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-amber-400" />
                        <span>Staff Console ({user.role})</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="pt-6 border-t border-slate-100 space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-xs font-bold text-slate-800">24x7 Tractor Helpline</p>
                  <p className="text-xs text-emerald-700 font-mono font-bold mt-0.5">📞 1800-180-1551</p>
                </div>
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      logout();
                    }}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out ({user?.profile?.fullName || user?.phone})
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setDrawerOpen(false)}
                    className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs text-center transition-colors"
                  >
                    Login / New Registration
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
