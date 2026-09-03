import React, { useState, useEffect } from 'react';
import { 
  LockoutScreen 
} from './LockoutScreen';
import { 
  LicenseAdminModal 
} from './LicenseAdminModal';
import { 
  IntegrationGuide 
} from './IntegrationGuide';
import { 
  LicenseConfig 
} from '../types/license';
import { 
  loadLicenseConfig, 
  saveLicenseConfig,
  formatTimeRemaining,
  addTimeMinutes,
  stopApplicationNow
} from '../utils/licenseManager';
import { 
  ShieldCheck, 
  Clock, 
  CalendarPlus, 
  Ban, 
  Settings, 
  HelpCircle, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';

interface LicenseGuardProps {
  children: React.ReactNode;
}

export const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const [config, setConfig] = useState<LicenseConfig>(() => loadLicenseConfig());
  const [now, setNow] = useState<number>(Date.now());
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [isBarCollapsed, setIsBarCollapsed] = useState<boolean>(false);

  // Interval to update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      // Save last checked time periodically
      if (currentTime - config.lastCheckedTime > 30000) {
        const updated = { ...config, lastCheckedTime: currentTime };
        saveLicenseConfig(updated);
        setConfig(updated);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [config]);

  const msRemaining = Math.max(0, config.expiresAt - now);
  const isExpired = msRemaining <= 0;
  const isManuallyStopped = config.isManuallyStopped;
  const isLocked = isManuallyStopped || isExpired;

  const timeFormatted = formatTimeRemaining(msRemaining);

  const handleConfigChange = (newConfig: LicenseConfig) => {
    setConfig(newConfig);
  };

  const handleQuickAdd5Min = () => {
    const updated = addTimeMinutes(5, 'إضافة 5 دقائق من الشريط العلوي');
    setConfig(updated);
  };

  const handleQuickAdd1Day = () => {
    const updated = addTimeMinutes(1440, 'إضافة يوم كامل من الشريط العلوي');
    setConfig(updated);
  };

  const handleQuickStop = () => {
    const updated = stopApplicationNow('إيقاف فوري من شريط التحكم السريع');
    setConfig(updated);
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* 1. If Locked (by Expiration or Manual Stop): Render Full-Screen Lockout Overlay */}
      {isLocked && (
        <LockoutScreen
          config={config}
          onConfigChange={handleConfigChange}
          openFullAdminPanel={() => setShowAdminPanel(true)}
        />
      )}

      {/* 2. When Active: Render the App Content */}
      <div className={`w-full min-h-screen ${isLocked ? 'pointer-events-none select-none filter blur-sm' : ''}`}>
        {children}
      </div>

      {/* 3. Floating Quick Admin Control Bar (Always accessible for testing the license behaviors) */}
      <div 
        id="license-status-floating-bar"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-[9999] max-w-xl transition-all select-none"
        dir="rtl"
      >
        <div className="bg-slate-950/90 border border-slate-700/80 rounded-2xl shadow-2xl p-3 text-slate-100 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLocked ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLocked ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
              </span>
              <div className="text-xs">
                <span className="font-bold text-white block">
                  {isLocked ? 'الحالة: محجوب وموقوف' : 'صلاحية التطبيق نشطة'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" />
                  المتبقي: <strong className="text-amber-300 font-bold">{timeFormatted.formatted}</strong>
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5">
              {!isBarCollapsed && (
                <>
                  <button
                    id="bar-add-5min-btn"
                    type="button"
                    onClick={handleQuickAdd5Min}
                    title="إضافة 5 دقائق فورية"
                    className="px-2.5 py-1.5 bg-sky-600/30 hover:bg-sky-600 border border-sky-500/40 text-sky-200 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">+5 دقائق</span>
                  </button>

                  <button
                    id="bar-add-1day-btn"
                    type="button"
                    onClick={handleQuickAdd1Day}
                    title="إضافة 1 يوم كامل (24 ساعة)"
                    className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-200 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">+1 يوم</span>
                  </button>

                  {!isLocked && (
                    <button
                      id="bar-stop-app-btn"
                      type="button"
                      onClick={handleQuickStop}
                      title="وقف التطبيق وحجب الشاشة فوراً"
                      className="px-2.5 py-1.5 bg-red-600/30 hover:bg-red-600 border border-red-500/40 text-red-200 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>وقف التطبيق 🛑</span>
                    </button>
                  )}
                </>
              )}

              {/* Open Admin Panel Button */}
              <button
                id="bar-open-admin-btn"
                type="button"
                onClick={() => setShowAdminPanel(true)}
                title="لوحة تحكم المسؤول والإعدادات"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Guide Button */}
              <button
                id="bar-open-guide-btn"
                type="button"
                onClick={() => setShowGuide(true)}
                title="دليل ربط هذا الكود بتطبيقك"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-xl transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* Collapse/Expand Toggle */}
              <button
                type="button"
                onClick={() => setIsBarCollapsed(!isBarCollapsed)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                {isBarCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Full Admin Panel Modal */}
      {showAdminPanel && (
        <LicenseAdminModal
          config={config}
          onConfigChange={handleConfigChange}
          onClose={() => setShowAdminPanel(false)}
          msRemaining={msRemaining}
        />
      )}

      {/* 5. Integration Guide Modal */}
      {showGuide && (
        <IntegrationGuide onClose={() => setShowGuide(false)} />
      )}
    </div>
  );
};
