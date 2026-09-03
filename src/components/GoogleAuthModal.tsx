import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Sparkles, Clock, AlertCircle, ArrowLeft, LogIn, KeyRound } from 'lucide-react';
import { AuthService, OWNER_PHONE, MONTHLY_PRICE_EGP } from '../services/auth';
import { AuthUser } from '../types';
import { AdminPasswordModal } from './AdminPasswordModal';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  isArabic: boolean;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isArabic,
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);

  // Initialize Google Identity Services button if available
  useEffect(() => {
    if (!isOpen) return;

    // Check if Google GSI is loaded
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        const google = (window as any).google;
        google.accounts.id.initialize({
          // Default client ID placeholder or from env
          client_id: (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '104812345678-placeholder.apps.googleusercontent.com',
          callback: (response: any) => {
            if (response.credential) {
              try {
                // Decode JWT
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const payload = JSON.parse(jsonPayload);
                
                const user = AuthService.signInWithGoogle({
                  email: payload.email,
                  name: payload.name || payload.email.split('@')[0],
                  picture: payload.picture,
                  googleId: payload.sub,
                });
                onSuccess(user);
                onClose();
              } catch (err) {
                console.error('Error decoding Google JWT:', err);
              }
            }
          },
        });

        const targetEl = document.getElementById('google-native-signin-btn');
        if (targetEl) {
          google.accounts.id.renderButton(targetEl, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'pill',
          });
        }
      } catch (err) {
        console.warn('GSI init notice:', err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateGoogleLogin = (emailToUse: string, nameToUse?: string) => {
    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      try {
        const user = AuthService.signInWithGoogle({
          email: emailToUse.trim().toLowerCase(),
          name: nameToUse || emailToUse.split('@')[0],
        });
        setIsSubmitting(false);
        onSuccess(user);
        onClose();
      } catch (err) {
        setIsSubmitting(false);
        setError('حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى');
      }
    }, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('يرجى كتابة بريد إلكتروني صحيح (مثال: yourname@gmail.com)');
      return;
    }
    handleSimulateGoogleLogin(customEmail, customName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        id="google-auth-modal"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header with gradient */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md shadow-indigo-950/30">
              {/* Google G Logo SVG */}
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black">
                {isArabic ? 'الدخول بحساب Google' : 'Sign in with Google'}
              </h2>
              <p className="text-xs text-indigo-200">
                {isArabic ? 'منصة LinguaReader Pro لتعلم اللغات بالقراءة' : 'LinguaReader Pro Platform'}
              </p>
            </div>
          </div>

          {/* Trial highlight badge */}
          <div className="mt-3 py-2 px-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Clock className="w-4 h-4" />
              <span>{isArabic ? 'فترة تجربة مجانية: 5 دقائق' : 'Free Trial: 5 Minutes'}</span>
            </div>
            <span className="text-indigo-200 text-[11px]">
              {isArabic ? `الاشتراك: ${MONTHLY_PRICE_EGP} ج.م / شهر` : `${MONTHLY_PRICE_EGP} EGP/month`}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Native Google Sign-In Container if online */}
          <div id="google-native-signin-btn" className="w-full flex justify-center min-h-[40px]"></div>

          {/* Instant Google Login Button */}
          <button
            id="instant-google-login-btn"
            onClick={() => handleSimulateGoogleLogin('user.demo@gmail.com', 'مستخدم تجريبي')}
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-slate-800 font-bold text-sm flex items-center justify-center gap-3 transition shadow-xs cursor-pointer"
          >
            {/* Google Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isArabic ? 'متابعة سريعة بحساب Google' : 'Continue with Google Account'}</span>
          </button>

          {/* Quick Login as Developer / Owner with Password */}
          <div className="pt-1">
            <button
              id="owner-quick-login-btn"
              type="button"
              onClick={() => setIsAdminPasswordModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-amber-400/30"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{isArabic ? 'دخول مدير ومصمم التطبيق (محمي بكلمة المرور)' : 'Admin Login (Password Protected)'}</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-xs font-medium">
              {isArabic ? 'أو أدخل بريدك الإلكتروني' : 'Or type your Gmail'}
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Form to enter Gmail address */}
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isArabic ? 'بريد Google الخاص بك:' : 'Your Google Email:'}
              </label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isArabic ? 'الاسم (اختياري):' : 'Full Name (optional):'}
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={isArabic ? 'اسمك الكريم' : 'Your name'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <LogIn className="w-4 h-4" />
              <span>{isArabic ? 'دخول التطبيق وبدء التجربة المجانية' : 'Enter & Start 5-Min Trial'}</span>
            </button>
          </form>

          {/* Note about subscription and WhatsApp */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isArabic ? 'شروط وسياسة الاستخدام:' : 'Subscription Terms:'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              {isArabic 
                ? `يحصل كل مستخدم جديد على 5 دقائق تجربة مجانية كاملة. بعد انتهاء المدة، يتطلب الاستمرار اشتراكاً شهرياً بقيمة ${MONTHLY_PRICE_EGP} جنيه في الشهر، ويتم التفعيل عبر التواصل المباشر مع مصمم التطبيق على الواتساب (${OWNER_PHONE}).`
                : `Every new user receives a full 5-minute trial. After that, continued access requires a monthly subscription of ${MONTHLY_PRICE_EGP} EGP, activated directly with the developer via WhatsApp (${OWNER_PHONE}).`}
            </p>
          </div>
        </div>
      </div>

      {/* Admin Password Gate Modal */}
      <AdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        onClose={() => setIsAdminPasswordModalOpen(false)}
        onSuccess={(adminUser) => {
          setIsAdminPasswordModalOpen(false);
          onSuccess(adminUser);
        }}
        isArabic={isArabic}
        title={isArabic ? 'تسجيل دخول مدير ومصمم التطبيق' : 'Admin Login'}
        subtitle={isArabic ? 'يرجى إدخال كلمة المرور السرية المعتمدة للمتابعة' : 'Enter master password to continue'}
      />
    </div>
  );
};
