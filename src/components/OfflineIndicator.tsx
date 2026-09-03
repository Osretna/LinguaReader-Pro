import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

interface OfflineIndicatorProps {
  isArabic?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isArabic = true }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div 
        id="reconnected-banner"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom"
      >
        <Wifi className="w-4 h-4" />
        <span>{isArabic ? 'تم استعادة الاتصال بالإنترنت' : 'Back Online'}</span>
      </div>
    );
  }

  return (
    <div 
      id="offline-banner"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom"
    >
      <WifiOff className="w-4 h-4" />
      <span>{isArabic ? 'وضع عدم الاتصال — يمكنك متابعة القراءة والمراجعة' : 'Offline Mode — Reading & SRS are fully available'}</span>
    </div>
  );
};
