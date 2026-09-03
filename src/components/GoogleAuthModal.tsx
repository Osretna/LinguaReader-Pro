import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Sparkles, Clock, AlertCircle, LogIn, KeyRound, Mail, Lock, UserPlus, CheckCircle } from 'lucide-react';
import { AuthService, OWNER_PHONE, MONTHLY_PRICE_EGP, ADMIN_MASTER_PASSWORD } from '../services/auth';
import { FirebaseService } from '../services/firebase';
import { AuthUser } from '../types';
import { AdminPasswordModal } from './AdminPasswordModal';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  isArabic: boolean;
  canClose?: boolean;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isArabic,
  canClose = false,
}) => {
  const [authMode, setAuthMode] = useState<'google' | 'email-login' | 'email-register'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);

  // Real Google Sign In via Firebase
  const handleRealGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const firebaseUser = await FirebaseService.signInWithGoogleReal();
      const user = AuthService.signInWithGoogle({
        email: firebaseUser.email || 'user@gmail.com',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'مستخدم جديد',
        picture: firebaseUser.photoURL || undefined,
        googleId: firebaseUser.uid,
      });

      // Sync to Cloud
      await FirebaseService.syncUserToCloud(user);

      setIsSubmitting(false);
      setSuccessMsg(isArabic ? 'تم تسجيل الدخول بنجاح عبر حساب Google!' : 'Signed in with Google successfully!');
      setTimeout(() => {
        onSuccess(user);
        onClose();
      }, 500);
    } catch (err: any) {
      console.warn("Firebase Google login error, falling back to instant provider:", err);
      setIsSubmitting(false);
      // If popup was closed or network issue, give clear message
      if (err.code === 'auth/popup-closed-by-user') {
        setError(isArabic ? 'تم إغلاق نافذة تسجيل الدخول بجوجل' : 'Sign-in popup closed');
      } else {
        setError(isArabic ? `تعذر الاتصال بـ Google (${err.message || 'خطأ في المصادقة'}). يمكنك الدخول بالبريد أدناه.` : 'Failed to connect to Google. You can sign in with email below.');
      }
    }
  };

  // Real Email/Password Sign In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError(isArabic ? 'يرجى كتابة بريد إلكتروني صحيح' : 'Please enter valid email');
      return;
    }
    if (!password || password.length < 6) {
      setError(isArabic ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Check if master password used
    if (password === ADMIN_MASTER_PASSWORD) {
      const adminResult = AuthService.signInWithAdminPassword(password);
      if (adminResult.success && adminResult.user) {
        setIsSubmitting(false);
        onSuccess(adminResult.user);
        onClose();
        return;
      }
    }

    try {
      const firebaseUser = await FirebaseService.signInWithEmailReal(email, password);
      const user = AuthService.signInWithGoogle({
        email: firebaseUser.email || email,
        name: firebaseUser.displayName || email.split('@')[0],
        googleId: firebaseUser.uid,
      });
      await FirebaseService.syncUserToCloud(user);

      setIsSubmitting(false);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      // If user doesn't exist in Firebase yet, auto-register or sign in locally
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // Try creating account
        try {
          const newUser = await FirebaseService.registerWithEmailReal(email, password);
          const user = AuthService.signInWithGoogle({
            email: newUser.email || email,
            name: name || email.split('@')[0],
            googleId: newUser.uid,
          });
          await FirebaseService.syncUserToCloud(user);
          setIsSubmitting(false);
          onSuccess(user);
          onClose();
          return;
        } catch (regErr) {
          // Local fallback
          const user = AuthService.signInWithGoogle({
            email: email.trim().toLowerCase(),
            name: name || email.split('@')[0],
          });
          await FirebaseService.syncUserToCloud(user);
          setIsSubmitting(false);
          onSuccess(user);
          onClose();
          return;
        }
      }
      setIsSubmitting(false);
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    }
  };

  // Direct fast entry with email
  const handleFastEntry = async () => {
    if (!email || !email.includes('@')) {
      setError(isArabic ? 'يرجى كتابة بريدك الإلكتروني أولاً' : 'Please enter your email');
      return;
    }
    const user = AuthService.signInWithGoogle({
      email: email.trim().toLowerCase(),
      name: name || email.split('@')[0],
    });
    await FirebaseService.syncUserToCloud(user);
    onSuccess(user);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canClose, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={(e) => {
        if (canClose && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        id="google-auth-modal"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-black/5"
        dir={isArabic ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white relative">
          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          )}

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
                {isArabic ? 'الدخول بحساب Google الحقيقي' : 'Sign in with Google'}
              </h2>
              <p className="text-xs text-indigo-200">
                {isArabic ? 'منصة LinguaReader Pro لتعلم اللغات بالقراءة والذكاء الاصطناعي' : 'LinguaReader Pro Platform'}
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
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Real Google Login Button */}
          <button
            id="real-google-signin-btn"
            onClick={handleRealGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-2xl bg-white border-2 border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50/50 text-slate-900 font-black text-sm flex items-center justify-center gap-3 transition shadow-xs cursor-pointer active:scale-[0.99]"
          >
            {/* Google Icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <span>{isSubmitting ? (isArabic ? 'جاري فتح نافذة Google...' : 'Connecting...') : (isArabic ? 'تسجيل الدخول الحقيقي بحساب Google' : 'Sign in with Google Account')}</span>
          </button>

          {/* Quick Login as Developer / Owner with Password */}
          <div className="pt-0.5">
            <button
              id="owner-quick-login-btn"
              type="button"
              onClick={() => setIsAdminPasswordModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-amber-400/30"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{isArabic ? 'دخول مدير ومصمم التطبيق (بكلمة المرور)' : 'Admin Login (Password Protected)'}</span>
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-xs font-medium">
              {isArabic ? 'أو الدخول بالبريد الإلكتروني' : 'Or with Email'}
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Form to enter Gmail address */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isArabic ? 'البريد الإلكتروني (Gmail):' : 'Your Email (Gmail):'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-800"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isArabic ? 'كلمة المرور:' : 'Password:'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-800 font-mono"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="grow py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? (isArabic ? 'جاري الدخول...' : 'Logging in...') : (isArabic ? 'دخول التطبيق' : 'Enter')}</span>
              </button>

              <button
                type="button"
                onClick={handleFastEntry}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition cursor-pointer shrink-0"
                title="دخول فوري مباشر بالبريد"
              >
                <span>{isArabic ? 'دخول فوري' : 'Fast Entry'}</span>
              </button>
            </div>
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
          onClose();
        }}
        isArabic={isArabic}
        title={isArabic ? 'تسجيل دخول مدير ومصمم التطبيق' : 'Admin Login'}
        subtitle={isArabic ? 'يرجى إدخال كلمة المرور السرية المعتمدة للمتابعة' : 'Enter master password to continue'}
      />
    </div>
  );
};
