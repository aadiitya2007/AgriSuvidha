import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DemoCredentialsBar } from './components/DemoCredentialsBar';
import { OfflineBanner } from './components/OfflineBanner';
import { IncidentAlertBanner } from './components/IncidentAlertBanner';
import { NotificationToastContainer } from './components/NotificationToastContainer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { CentreDiscoveryPage } from './pages/farmer/CentreDiscoveryPage';
import { SlotBookingPage } from './pages/farmer/SlotBookingPage';
import { LiveQueuePage } from './pages/farmer/LiveQueuePage';
import { ProcurementHistoryPage } from './pages/farmer/ProcurementHistoryPage';
import { AgriStorePage } from './pages/farmer/AgriStorePage';
import { SupportTicketsPage } from './pages/farmer/SupportTicketsPage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { ExecutiveDashboard } from './pages/admin/ExecutiveDashboard';
import { LiveQueueOperationsPage } from './pages/admin/LiveQueueOperationsPage';
import { ProcurementInspectionPage } from './pages/admin/ProcurementInspectionPage';
import { PaymentLedgerPage } from './pages/admin/PaymentLedgerPage';
import { IncidentCommandPage } from './pages/admin/IncidentCommandPage';
import { InventoryManagementPage } from './pages/admin/InventoryManagementPage';
import { SupportInboxPage } from './pages/admin/SupportInboxPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-xs">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <DemoCredentialsBar />
      <NotificationToastContainer />
      <OfflineBanner />
      <IncidentAlertBanner />
      {!isAdminRoute && <Navbar />}

      <div className="flex-1">
        <Routes>
          {/* Public / Farmer Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/centres" element={<CentreDiscoveryPage />} />
          <Route path="/queue" element={<LiveQueuePage />} />

          {/* Protected Farmer Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/book-slot"
            element={
              <ProtectedRoute>
                <SlotBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/procurements"
            element={
              <ProtectedRoute>
                <ProcurementHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/store"
            element={
              <ProtectedRoute>
                <AgriStorePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportTicketsPage />
              </ProtectedRoute>
            }
          />

          {/* Staff & Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['CENTRE_OPERATOR', 'CENTRE_MANAGER', 'PLATFORM_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ExecutiveDashboard />} />
            <Route path="queue" element={<LiveQueueOperationsPage />} />
            <Route path="procurement" element={<ProcurementInspectionPage />} />
            <Route path="payments" element={<PaymentLedgerPage />} />
            <Route path="incidents" element={<IncidentCommandPage />} />
            <Route path="orders" element={<InventoryManagementPage />} />
            <Route path="tickets" element={<SupportInboxPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {!isAdminRoute && <Footer />}
    </div>
  );
};

import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
