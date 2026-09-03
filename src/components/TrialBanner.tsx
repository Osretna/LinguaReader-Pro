import React from 'react';
import { Clock, Sparkles, MessageCircle, Crown, LogIn, ShieldCheck, ChevronRight } from 'lucide-react';
import { AuthUser } from '../types';
import { OWNER_PHONE, OWNER_WHATSAPP_LINK, MONTHLY_PRICE_EGP } from '../services/auth';

interface TrialBannerProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  isArabic: boolean;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  user,
  onOpenAuth,
  onOpenAdmin,
  isArabic,
}) => {
  // Hide banner for non-admin users and guests so they experience a clean app without renewal prompts
  if (!user || user.role !== 'admin') {
    return null;
  }

  // Admin / Owner logged in status bar
  return (
    <div 
      id="admin-status-bar"
      className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-amber-300 py-1.5 px-4 border-b border-amber-400/30 select-none"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="font-bold">
            {isArabic ? `مرحباً يا باشمهندس محمد (مصمم ومدير التطبيق - ${OWNER_PHONE})` : `Owner & Admin Mode (${OWNER_PHONE})`}
          </span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">| وصول دائم غير محدود</span>
        </div>

        <button
          onClick={onOpenAdmin}
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition cursor-pointer text-xs shadow-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isArabic ? 'لوحة التحكم والصلاحيات' : 'Admin Panel'}</span>
        </button>
      </div>
    </div>
  );
};
