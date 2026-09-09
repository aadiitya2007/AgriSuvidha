import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2.5 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>You are currently browsing in offline mode. Saved procurement receipts and token cards remain available.</span>
      <button
        onClick={() => window.location.reload()}
        className="underline font-semibold ml-2 hover:text-amber-100 flex items-center gap-1"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    </div>
  );
};
