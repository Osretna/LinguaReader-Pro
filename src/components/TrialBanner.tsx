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
  // 1. Not logged in state
  if (!user) {
    return (
      <div 
        id="guest-trial-bar"
        className="w-full bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white py-2 px-4 shadow-sm"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isArabic 
                ? `سجّل الدخول بحساب Google واحصل على 5 دقائق تجربة مجانية كاملة! (الاشتراك الشهري بعد التجربة: ${MONTHLY_PRICE_EGP} جنيه)`
                : `Sign in with Google for a free 5-minute trial! (${MONTHLY_PRICE_EGP} EGP/month thereafter)`}
            </span>
          </div>

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-indigo-950 font-bold hover:bg-indigo-50 transition shadow-xs cursor-pointer text-xs"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isArabic ? 'دخول بحساب Google' : 'Sign in with Google'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Admin / Owner logged in state
  if (user.role === 'admin') {
    return (
      <div 
        id="admin-status-bar"
        className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-amber-300 py-1.5 px-4 border-b border-amber-400/30"
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
  }

  const sub = user.subscription;

  // 3. User in active paid or lifetime subscription
  if (sub.status === 'lifetime' || sub.status === 'active') {
    return null; // Clean experience, no trial banner needed
  }

  // 4. Trial active countdown state
  const remaining = sub.trialSecondsRemaining;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = remaining <= 60;

  const whatsappUrl = `https://wa.me/201120194940?text=${encodeURIComponent(
    `السلام عليكم يا باشمهندس محمد، أود تفعيل اشتراكي في تطبيق LinguaReader Pro (الاشتراك الشهري 100 جنيه). حسابي: ${user.email}`
  )}`;

  return (
    <div 
      id="user-trial-active-bar"
      className={`w-full py-1.5 px-4 transition-colors ${
        isUrgent 
          ? 'bg-rose-600 text-white animate-pulse' 
          : 'bg-amber-500 text-slate-950 font-semibold'
      }`}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {isArabic 
              ? `الفترة التجريبية المجانية: تبقى (${formattedTime}) دقائق فقط`
              : `Free Trial: (${formattedTime}) remaining`}
          </span>
          <span className="hidden md:inline opacity-85 text-[11px]">
            {isArabic ? `— الاشتراك الشهري: ${MONTHLY_PRICE_EGP} جنيه في الشهر` : `— ${MONTHLY_PRICE_EGP} EGP/month`}
          </span>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-950 text-white hover:bg-slate-800 transition text-[11px] font-bold cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isArabic ? 'تواصل مع المصمم (واتساب)' : 'Contact Owner (WhatsApp)'}</span>
        </a>
      </div>
    </div>
  );
};
