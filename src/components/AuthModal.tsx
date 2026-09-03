import React, { useState } from 'react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  registerWithEmail, 
  resetPassword 
} from '../firebase';
import { 
  LogIn, 
  Mail, 
  Lock, 
  User as UserIcon, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('تم إغلاق نافذة الدخول بواسطة المستخدم. يرجى المحاولة مرة أخرى.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('يرجى التأكد من إضافة نطاق الموقع إلى Authorized Domains في Firebase Console.');
      } else {
        setError(err.message || 'فشل تسجيل الدخول بحساب Google. يرجى التحقق من الاتصال.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || (!isForgotPassword && !password)) {
      setError('يرجى ملء كافة الحقول المطلوبة');
      return;
    }

    try {
      setLoading(true);
      if (isForgotPassword) {
        await resetPassword(email);
        setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.');
      } else if (isRegistering) {
        await registerWithEmail(email, password, displayName);
        if (onSuccess) onSuccess();
      } else {
        await signInWithEmail(email, password);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error("Email auth error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('هذا البريد الإلكتروني مسجل مسبقاً، يمكنك تسجيل الدخول مباشرة.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة، يرجى إدخال 6 أحرف أو أرقام على الأقل.');
      } else {
        setError(err.message || 'حدث خطأ أثناء المصادقة.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="auth-modal-card" 
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden"
      >
        {/* Decorative Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-3 shadow-inner">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>LinguaReader Pro</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">النسخة الاحترافية</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            {isForgotPassword 
              ? 'استعادة كلمة المرور لحسابك' 
              : isRegistering 
                ? 'أنشئ حسابك الجديد للبدء في القراءة التفاعلية' 
                : 'تسجيل الدخول ومتابعة تقدمك في القراءة'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div id="auth-error-alert" className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {message && (
          <div id="auth-success-alert" className="mb-4 p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
            <div className="leading-relaxed">{message}</div>
          </div>
        )}

        {/* Real Google Sign-In Button */}
        {!isForgotPassword && (
          <div className="mb-5">
            <button
              id="google-signin-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl transition duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'جارٍ الاتصال بجوجل...' : 'الدخول السريع بحساب Google'}</span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-700"></div>
              <span className="px-3 text-xs text-slate-400 uppercase tracking-wider">أو بالبريد الإلكتروني</span>
              <div className="flex-1 border-t border-slate-700"></div>
            </div>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegistering && !isForgotPassword && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">الاسم الكامل (اختياري)</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="auth-name-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">كلمة المرور</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : isForgotPassword ? (
              <>
                <span>إرسال رابط الاستعادة</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            ) : isRegistering ? (
              <>
                <span>إنشاء الحساب والتسجيل</span>
                <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {isForgotPassword ? (
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              الرجوع إلى تسجيل الدخول
            </button>
          ) : isRegistering ? (
            <div>
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
              >
                تسجيل الدخول
              </button>
            </div>
          ) : (
            <div>
              ليس لديك حساب بعد؟{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
              >
                إنشاء حساب جديد
              </button>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>مصادقة آمنة ومشفرة عبر Google Firebase</span>
        </div>
      </div>
    </div>
  );
};
