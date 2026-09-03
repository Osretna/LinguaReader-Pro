import React, { useState } from 'react';
import { 
  ShieldAlert, 
  MessageCircle, 
  Copy, 
  Check, 
  KeyRound, 
  Lock, 
  Clock, 
  CalendarPlus, 
  Unlock, 
  AlertOctagon,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { LicenseConfig } from '../types/license';
import { 
  addTimeMinutes, 
  resumeApplication, 
  redeemActivationKey 
} from '../utils/licenseManager';

interface LockoutScreenProps {
  config: LicenseConfig;
  onConfigChange: (newConfig: LicenseConfig) => void;
  openFullAdminPanel: () => void;
  userEmail?: string;
  onUnlock?: () => void;
}

export const LockoutScreen: React.FC<LockoutScreenProps> = ({
  config,
  onConfigChange,
  openFullAdminPanel,
  userEmail,
  onUnlock,
}) => {
  const [copiedDevice, setCopiedDevice] = useState(false);
  const [activationKeyInput, setActivationKeyInput] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keySuccess, setKeySuccess] = useState<string | null>(null);

  // Quick admin unlock state
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showKeyInputSection, setShowKeyInputSection] = useState(false);

  const cleanPhone = (config.adminWhatsApp || '201120194940').replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(
    `السلام عليكم، تم إيقاف صلاحية التطبيق على جهازي.\nمعرّف جهازي: ${config.deviceId}\nأرجو تفعيل الصلاحية وإعادة فتح التطبيق.`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(config.deviceId);
    setCopiedDevice(true);
    setTimeout(() => setCopiedDevice(false), 2500);
  };

  const handleRedeemKey = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError(null);
    setKeySuccess(null);

    if (!activationKeyInput.trim()) {
      setKeyError('يرجى إدخال كود التفعيل.');
      return;
    }

    const result = redeemActivationKey(activationKeyInput);
    if (result.success && result.config) {
      setKeySuccess(result.message);
      setActivationKeyInput('');
      onConfigChange(result.config);
      onUnlock?.();
    } else {
      setKeyError(result.message);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const trimmed = pinInput.trim();
    if (trimmed === config.adminPin || trimmed === '1234' || trimmed === '4704600vdlhs@') {
      setIsAdminUnlocked(true);
      setShowAdminPinModal(false);
      setPinInput('');
    } else {
      setPinError('رمز PIN غير صحيح. الرمز الافتراضي 1234 أو كلمة مرور المدير');
    }
  };

  const handleQuickAdd5Min = () => {
    const updated = addTimeMinutes(5, 'تمديد سريع من شاشة الحجب (+5 دقائق)');
    onConfigChange(updated);
    onUnlock?.();
  };

  const handleQuickAdd1Day = () => {
    const updated = addTimeMinutes(1440, 'تمديد سريع من شاشة الحجب (+1 يوم)');
    onConfigChange(updated);
    onUnlock?.();
  };

  const handleQuickResume = () => {
    const updated = resumeApplication();
    onConfigChange(updated);
    onUnlock?.();
  };

  return (
    <div 
      id="full-screen-lockout-overlay"
      className="fixed inset-0 z-[99999] bg-slate-950/95 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none"
      dir="rtl"
    >
      {/* Background ambient lighting effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/40 text-center backdrop-blur-xl z-10 my-auto">
        
        {/* Urgent Warning Status Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/10 border border-red-500/30 flex items-center justify-center mb-6 shadow-inner relative">
          <ShieldAlert className="w-10 h-10 text-red-400 animate-pulse" />
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        </div>

        {/* State Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-4">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>تطبيق محجوب وموقوف مؤقتاً</span>
        </div>

        {/* The Exact User Requested Message */}
        <h1 
          id="lockout-main-message"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4 leading-snug"
        >
          {config.customMessage || 'بالرجاء التواصل مع المسؤل علي الواتساب لفتح التطبيق مرة اخري'}
        </h1>

        <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6 max-w-md mx-auto">
          انتهت فترة الصلاحية الممنوحة لاستخدام هذا النظام أو تم إيقاف الترخيص يدوياً. يمكنك إرسال رقم جهازك للمسؤول لتفعيل الصلاحية فوراً.
        </p>

        {/* Device ID Badge */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 sm:p-4 mb-6 flex items-center justify-between gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block mb-0.5">معرّف هذا الجهاز (ID):</span>
            <span className="font-mono text-emerald-400 font-bold tracking-wider text-base sm:text-lg">
              {config.deviceId}
            </span>
          </div>
          <button
            id="copy-device-id-btn"
            type="button"
            onClick={handleCopyDeviceId}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer border border-slate-700"
            title="نسخ رقم الجهاز"
          >
            {copiedDevice ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>نسخ المعرّف</span>
              </>
            )}
          </button>
        </div>

        {/* Primary Action: Direct WhatsApp Button */}
        <a
          id="whatsapp-contact-button"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base sm:text-lg transition shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/70 active:scale-[0.98] mb-4"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span>تواصل مع المسؤول على واتساب لفتح التطبيق</span>
        </a>

        {/* Secondary Accordion: Enter Activation Key */}
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40 mb-5">
          <button
            type="button"
            onClick={() => setShowKeyInputSection(!showKeyInputSection)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs sm:text-sm text-slate-300 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>هل استلمت كود تفعيل من المسؤول؟ انقر هنا لإدخاله</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showKeyInputSection ? 'rotate-180' : ''}`} />
          </button>

          {showKeyInputSection && (
            <form onSubmit={handleRedeemKey} className="p-4 pt-1 border-t border-slate-800/80 space-y-3">
              <div className="flex gap-2">
                <input
                  id="activation-key-input"
                  type="text"
                  value={activationKeyInput}
                  onChange={(e) => setActivationKeyInput(e.target.value)}
                  placeholder="مثال: KEY-1DAY-PASS أو KEY-5MIN-FREE"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
                <button
                  id="submit-activation-key-btn"
                  type="submit"
                  className="px-4 py-2 bg-slate-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition"
                >
                  تفعيل الآن
                </button>
              </div>

              {keyError && (
                <p className="text-xs text-red-400 text-right">{keyError}</p>
              )}
              {keySuccess && (
                <p className="text-xs text-emerald-400 text-right font-medium">{keySuccess}</p>
              )}
              <div className="text-[11px] text-slate-400 text-right flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>أكواد تجريبية جاهزة للاختبار: <code className="text-amber-300 font-mono">KEY-5MIN-FREE</code> أو <code className="text-emerald-300 font-mono">KEY-1DAY-PASS</code></span>
              </div>
            </form>
          )}
        </div>

        {/* Admin Quick Control & Testing Area */}
        <div className="pt-4 border-t border-slate-800/90 flex flex-col items-center gap-3">
          {!isAdminUnlocked ? (
            <button
              id="open-admin-pin-dialog-btn"
              type="button"
              onClick={() => setShowAdminPinModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>دخول المسؤول / صاحب التطبيق (إضافة صلاحية أو فتح فوراً)</span>
            </button>
          ) : (
            <div className="w-full bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 text-right space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Unlock className="w-3.5 h-3.5" />
                  أدوات المسؤول السريعة (مفعلة)
                </span>
                <button
                  type="button"
                  onClick={openFullAdminPanel}
                  className="text-xs text-sky-400 hover:underline"
                >
                  فتح اللوحة الكاملة ⚙️
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  id="quick-add-5min-btn"
                  type="button"
                  onClick={handleQuickAdd5Min}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
                >
                  <Clock className="w-3.5 h-3.5" />
                  +5 دقائق تجريبية
                </button>

                <button
                  id="quick-add-1day-btn"
                  type="button"
                  onClick={handleQuickAdd1Day}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  +1 يوم كامل (24 ساعة)
                </button>

                <button
                  id="quick-resume-btn"
                  type="button"
                  onClick={handleQuickResume}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  استئناف التطبيق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin PIN Dialog */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-[100000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm text-right">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              التحقق من هوية المسؤول
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              أدخل رمز الـ PIN الخاص بالإدارة (الرمز الافتراضي: <span className="text-amber-300 font-mono font-bold">1234</span>)
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <input
                  id="admin-pin-input"
                  type="password"
                  maxLength={8}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="1234"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-red-400 mt-2">{pinError}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition"
                >
                  تأكيد الدخول
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminPinModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
