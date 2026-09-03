import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { AuthService, OWNER_PHONE, OWNER_WHATSAPP_LINK } from '../services/auth';
import { AdminPasswordModal } from './AdminPasswordModal';

interface GlobalAppLockModalProps {
  isLocked: boolean;
  reason?: string;
  isArabic: boolean;
  onAdminUnlock?: () => void;
}

export const GlobalAppLockModal: React.FC<GlobalAppLockModalProps> = ({
  isLocked,
  reason,
  isArabic,
  onAdminUnlock,
}) => {
  const [isAdminPasswordOpen, setIsAdminPasswordOpen] = useState(false);

  if (!isLocked) return null;

  return (
    <div 
      id="global-app-lock-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-lg animate-fadeIn text-slate-100"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-lg bg-slate-900 border-2 border-rose-600/60 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl space-y-6">
        
        {/* Pulsing Top Security Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 animate-pulse" />

        {/* Shield Icon */}
        <div className="w-20 h-20 rounded-3xl bg-rose-950/80 border-2 border-rose-500/50 flex items-center justify-center mx-auto text-rose-400 shadow-xl shadow-rose-900/30">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إشعار إداري عاجل: التطبيق مغلق' : 'Administrative Notice: Application Locked'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isArabic ? 'تم إغلاق التطبيق بواسطة الإدارة' : 'App Closed by Administration'}
          </h2>

          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-slate-200 text-sm font-medium leading-relaxed">
            <p>
              {reason || (isArabic 
                ? 'تم إغلاق التطبيق مؤقتاً لأعمال الصيانة والتحديثات من قبل الإدارة.' 
                : 'The application is temporarily closed for maintenance by administrators.')}
            </p>
          </div>
        </div>

        {/* Real-time sync status pill */}
        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span>
            {isArabic 
              ? 'المزامنة اللحظية متصلة ⚡ سيفتح التطبيق تلقائياً فور إلغاء القفل من الإدارة' 
              : 'Real-time sync active ⚡ App unlocks automatically once released by admin'}
          </span>
        </div>

        {/* WhatsApp & Admin Unlock Options */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <a
            href={OWNER_WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition cursor-pointer"
          >
            <span>{isArabic ? `تواصل مع الإدارة (${OWNER_PHONE})` : `Contact Admin (${OWNER_PHONE})`}</span>
          </a>

          <button
            onClick={() => setIsAdminPasswordOpen(true)}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>{isArabic ? 'دخول المصمم' : 'Owner Login'}</span>
          </button>
        </div>
      </div>

      {/* Admin Master Password Unlock Modal */}
      <AdminPasswordModal
        isOpen={isAdminPasswordOpen}
        onClose={() => setIsAdminPasswordOpen(false)}
        onSuccess={() => {
          setIsAdminPasswordOpen(false);
          AuthService.unlockDevice();
          onAdminUnlock?.();
        }}
        isArabic={isArabic}
        title={isArabic ? 'إلغاء قفل الجهاز بكلمة سر المصمم' : 'Owner Password Unlock'}
        subtitle={isArabic ? 'أدخل كلمة المرور السرية للمصمم لفتح التطبيق على هذا الجهاز فوراً' : 'Enter owner password'}
      />
    </div>
  );
};
