import React, { useState } from 'react';
import { 
  Clock, 
  CalendarPlus, 
  Ban, 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { LicenseConfig } from '../types/license';
import { 
  addTimeMinutes, 
  stopApplicationNow, 
  formatTimeRemaining 
} from '../utils/licenseManager';

interface FloatingLicenseControlProps {
  config: LicenseConfig;
  onConfigChange: (newConfig: LicenseConfig) => void;
  onOpenAdmin: () => void;
  msRemaining: number;
}

export const FloatingLicenseControl: React.FC<FloatingLicenseControlProps> = ({
  config,
  onConfigChange,
  onOpenAdmin,
  msRemaining,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const timeFormatted = formatTimeRemaining(msRemaining);

  const handleAdd5Min = () => {
    const updated = addTimeMinutes(5, 'إضافة سريعة 5 دقائق من الشريط العائم');
    onConfigChange(updated);
  };

  const handleAdd1Day = () => {
    const updated = addTimeMinutes(1440, 'إضافة سريعة يوم كامل (24 ساعة) من الشريط العائم');
    onConfigChange(updated);
  };

  const handleStopApp = () => {
    const updated = stopApplicationNow('وقف التطبيق من الشريط العائم');
    onConfigChange(updated);
  };

  return (
    <div 
      id="floating-license-quick-controls"
      className="fixed bottom-4 left-4 z-40 max-w-sm sm:max-w-md select-none transition-all duration-300"
      dir="rtl"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Top bar with countdown & collapse toggle */}
        <div className="px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-300">
              صلاحية التطبيق:
            </span>
            <span className="font-mono font-bold text-amber-400 text-xs px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
              {timeFormatted.formatted}
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isExpanded ? 'تصغير شريط التحكم' : 'توسيع شريط التحكم'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Action buttons (Visible when expanded) */}
        {isExpanded && (
          <div className="p-3 space-y-2">
            <div className="text-[10px] text-slate-400 leading-snug">
              أزرار التحكم بالصلاحية (إضافة يوم / 5 دقائق / وقف التطبيق وحجبه):
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {/* +5 Minutes */}
              <button
                id="btn-add-5-minutes"
                onClick={handleAdd5Min}
                className="px-2 py-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                title="إضافة 5 دقائق تجريبية"
              >
                <Clock className="w-4 h-4 text-sky-400" />
                <span className="text-[11px]">+5 دقائق</span>
              </button>

              {/* +1 Day */}
              <button
                id="btn-add-1-day"
                onClick={handleAdd1Day}
                className="px-2 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                title="إضافة يوم كامل (24 ساعة)"
              >
                <CalendarPlus className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px]">+1 يوم</span>
              </button>

              {/* Stop App */}
              <button
                id="btn-stop-app"
                onClick={handleStopApp}
                className="px-2 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold rounded-xl text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer active:scale-95"
                title="وقف التطبيق فوراً وإظهار شاشة الحجب بالكامل"
              >
                <Ban className="w-4 h-4 text-rose-400" />
                <span className="text-[11px]">وقف التطبيق</span>
              </button>
            </div>

            {/* Admin Panel Quick Link */}
            <div className="pt-1 flex items-center justify-between border-t border-slate-800 text-[11px]">
              <span className="text-slate-500 font-mono text-[10px]">
                {config.deviceId}
              </span>
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>لوحة التحكم الكاملة</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
