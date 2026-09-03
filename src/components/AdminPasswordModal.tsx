import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, CheckCircle, X, ShieldCheck } from 'lucide-react';
import { AuthService, ADMIN_MASTER_PASSWORD } from '../services/auth';
import { AuthUser } from '../types';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminUser: AuthUser) => void;
  isArabic: boolean;
  title?: string;
  subtitle?: string;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isArabic,
  title,
  subtitle,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError(isArabic ? 'يرجى كتابة كلمة المرور للمتابعة' : 'Please enter password');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      const result = AuthService.signInWithAdminPassword(password.trim());
      setIsSubmitting(false);

      if (result.success && result.user) {
        onSuccess(result.user);
        onClose();
      } else {
        setError(isArabic ? 'كلمة المرور غير صحيحة! الوصول مقيد لمصمم التطبيق فقط.' : 'Incorrect password! Access restricted.');
      }
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div 
        id="admin-password-modal"
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">
                {title || (isArabic ? 'تأكيد هوية مصمم ومدير التطبيق' : 'Admin Password Authentication')}
              </h3>
              <p className="text-[11px] text-slate-300">
                {subtitle || (isArabic ? 'أدخل كلمة المرور الخاصة بك للفتح والدخول' : 'Enter your admin password to unlock')}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isArabic ? 'كلمة المرور السرية:' : 'Secret Password:'}
            </label>
            <div className="relative">
              <input
                type="password"
                autoFocus
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden text-sm text-slate-900 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="grow py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري التحقق...' : (isArabic ? 'تأكيد الدخول وإلغاء القفل' : 'Unlock Application')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400">
            {isArabic ? 'هذه الميزة مخصصة لمصمم ومدير التطبيق فقط' : 'Protected area for developer and owner only'}
          </p>
        </form>
      </div>
    </div>
  );
};
