import React, { useState } from 'react';
import { 
  Lock, 
  MessageCircle, 
  Sparkles, 
  KeyRound, 
  CheckCircle, 
  AlertCircle, 
  LogOut,
  Clock,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { 
  AuthService, 
  OWNER_PHONE, 
  OWNER_WHATSAPP_LINK, 
  MONTHLY_PRICE_EGP,
  ADMIN_MASTER_PASSWORD
} from '../services/auth';
import { AuthUser } from '../types';
import { AdminPasswordModal } from './AdminPasswordModal';

interface SubscriptionLockModalProps {
  user: AuthUser | null;
  onRefreshUser: () => void;
  onUnlock?: () => void;
  onSignOut: () => void;
  isArabic: boolean;
}

export const SubscriptionLockModal: React.FC<SubscriptionLockModalProps> = ({
  user,
  onRefreshUser,
  onUnlock,
  onSignOut,
  isArabic,
}) => {
  const [activationCode, setActivationCode] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isAdminPasswordOpen, setIsAdminPasswordOpen] = useState(false);

  const whatsappUrl = AuthService.getWhatsAppUrl(user);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = activationCode.trim();
    if (!raw) {
      setActivationError('يرجى إدخال كود التفعيل المستلم من المصمم');
      return;
    }

    setIsActivating(true);
    setActivationError(null);
    setActivationSuccess(null);

    // Direct Master Password check (4704600vdlhs@) - Unlock immediately
    if (raw === ADMIN_MASTER_PASSWORD) {
      AuthService.unlockDevice();
      AuthService.setAdminSessionAuthenticated();
      if (user) {
        AuthService.grantUserPermission(user.id, 'lifetime', 'كلمة سر المدير');
      } else {
        AuthService.signInWithAdminPassword(ADMIN_MASTER_PASSWORD);
      }
      setIsActivating(false);
      setActivationSuccess('تم فتح التطبيق بنجاح بكلمة سر المدير!');
      onUnlock?.();
      onRefreshUser();
      return;
    }

    setTimeout(() => {
      // If regular user with code
      if (user) {
        const result = AuthService.activateWithCode(user, raw);
        setIsActivating(false);
        if (result.success) {
          AuthService.unlockDevice();
          setActivationSuccess(result.message);
          onUnlock?.();
          onRefreshUser();
        } else {
          setActivationError(result.message);
        }
      } else {
        // Guest user entering code
        setIsActivating(false);
        setActivationError('يرجى تسجيل الدخول بحساب Google أولاً لتفعيل هذا الكود على بريدك الإلكتروني.');
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        id="subscription-lock-card"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Top Header Banner */}
        <div className="p-6 bg-gradient-to-br from-rose-600 via-rose-700 to-indigo-950 text-white relative">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Lock className="w-6 h-6 text-white" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 text-rose-200 text-xs font-semibold border border-rose-300/20">
              <Clock className="w-3.5 h-3.5" />
              <span>{isArabic ? 'انتهت فترة التجربة (5 دقائق)' : 'Trial Expired (5 mins)'}</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black leading-tight text-white mb-1.5">
            {isArabic ? 'انتهت الفترة التجريبية المجانية' : 'Your Free Trial Has Ended'}
          </h2>

          {/* User Requested Required Exact Statement */}
          <div className="mt-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20">
            <p className="text-sm sm:text-base font-bold text-amber-200 leading-snug">
              {isArabic 
                ? '« لمتابعة استخدام التطبيق عليك التواصل مع مصمم التطبيق علي الواتساب »'
                : '« To continue using the application, please contact the developer via WhatsApp »'}
            </p>
          </div>

          {/* Real-time sync status badge */}
          <div className="mt-3 flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>
              {isArabic 
                ? 'المزامنة اللحظية نشطة: عند تفعيلك من الإدارة تفتح الشاشة فوراً دون تحديث الصفحة ⚡' 
                : 'Real-time sync active: Unlocks instantly once approved by admin ⚡'}
            </span>
          </div>
        </div>

        {/* Body Section */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider block">
                {isArabic ? 'خطة الاشتراك الرسمية' : 'Official Plan'}
              </span>
              <span className="text-lg font-black text-slate-900">
                {isArabic ? `الاشتراك الشهري: ${MONTHLY_PRICE_EGP} جنيه في الشهر` : `Monthly Subscription: ${MONTHLY_PRICE_EGP} EGP / Month`}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isArabic ? 'وصول شامل لجميع اللغات، النطق بالذكاء الاصطناعي، واختبار المستوى' : 'Full access to all languages, AI speech, and level diagnostic'}
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-sm shadow-xs shrink-0">
              {MONTHLY_PRICE_EGP} {isArabic ? 'ج.م' : 'EGP'}
            </div>
          </div>

          {/* User Account Info Bar */}
          <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{isArabic ? 'حسابك:' : 'Account:'}</span>
              <span className="text-indigo-600 font-medium truncate max-w-[200px]">
                {user ? user.email : (isArabic ? 'غير مسجل (الجهاز مقفل)' : 'Guest (Device Locked)')}
              </span>
            </div>
            {user && (
              <button
                onClick={onSignOut}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تبديل الحساب' : 'Switch'}</span>
              </button>
            )}
          </div>

          {/* Direct WhatsApp Call to Action Button */}
          <div>
            <a
              id="whatsapp-contact-owner-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <MessageCircle className="w-6 h-6 fill-white" />
              <div className="text-center">
                <span>
                  {isArabic 
                    ? `تواصل عبر الواتساب لتفعيل حسابك (${OWNER_PHONE})` 
                    : `Contact Owner on WhatsApp (${OWNER_PHONE})`}
                </span>
                <span className="block text-[11px] font-normal text-emerald-100">
                  {isArabic ? 'انقر هنا لفتح المحادثة المباشرة مع المصمم فوراً' : 'Click to start direct chat with developer'}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>
          </div>

          {/* Activation Code Redemption Box */}
          <div className="p-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <span>{isArabic ? 'أدخل كود التفعيل المستلم من المصمم:' : 'Enter Activation Code from Owner:'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminPasswordOpen(true)}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer underline"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>{isArabic ? 'دخول المدير' : 'Admin Login'}</span>
              </button>
            </div>

            <form onSubmit={handleActivate} className="flex gap-2">
              <input
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder={isArabic ? 'مثال: READ-1M-XXXX أو رمز المدير' : 'e.g. READ-1M-XXXX'}
                className="grow px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm uppercase tracking-wider font-mono text-slate-800 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden"
              />
              <button
                type="submit"
                disabled={isActivating}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition shadow-xs cursor-pointer"
              >
                {isActivating ? 'جاري التحقق...' : (isArabic ? 'تفعيل الحساب' : 'Activate')}
              </button>
            </form>

            {activationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{activationError}</span>
              </div>
            )}

            {activationSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{activationSuccess}</span>
              </div>
            )}
          </div>

          {/* Feature list preview */}
          <div className="pt-1 text-slate-600">
            <span className="text-xs font-bold text-slate-800 block mb-2">
              {isArabic ? 'ماذا ستحصل عليه فور تفعيل الاشتراك؟' : 'What you get upon activation:'}
            </span>
            <ul className="text-xs space-y-1.5 text-slate-600 pr-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{isArabic ? 'مكتبة كاملة متدرجة بالمستويات (A1 حتى C2)' : 'Full graded library (A1 to C2)'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{isArabic ? 'نطق صوتي ذكي وترجمة فورية مع إعراب الكلمات' : 'Instant translation & smart AI pronunciation'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{isArabic ? 'اختبار وتحديد المستوى الصوتي التفاعلي عبر الذكاء الاصطناعي' : 'Interactive voice diagnostic testing'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{isArabic ? 'نظام التكرار المتباعد الذكي لحفظ الكلمات (SRS)' : 'Spaced Repetition System (SRS)'}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Admin Password Gate Modal */}
      <AdminPasswordModal
        isOpen={isAdminPasswordOpen}
        onClose={() => setIsAdminPasswordOpen(false)}
        onSuccess={() => {
          setIsAdminPasswordOpen(false);
          AuthService.unlockDevice();
          onUnlock?.();
          onRefreshUser();
        }}
        isArabic={isArabic}
        title={isArabic ? 'فتح التطبيق بكلمة سر المدير' : 'Admin Password Unlock'}
        subtitle={isArabic ? 'أدخل كلمة المرور السرية لفتح الجهاز فوراً' : 'Enter master password to unlock'}
      />
    </div>
  );
};
