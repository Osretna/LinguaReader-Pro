import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  KeyRound, 
  Plus, 
  Copy, 
  Check, 
  Clock, 
  CalendarPlus, 
  Ban, 
  Unlock, 
  MessageSquare, 
  Phone, 
  ShieldAlert, 
  History,
  RotateCcw
} from 'lucide-react';
import { LicenseConfig, ActivationKey } from '../types/license';
import { 
  addTimeMinutes, 
  stopApplicationNow, 
  resumeApplication, 
  createNewActivationKey, 
  saveLicenseConfig,
  formatTimeRemaining
} from '../utils/licenseManager';

interface LicenseAdminModalProps {
  config: LicenseConfig;
  onConfigChange: (newConfig: LicenseConfig) => void;
  onClose: () => void;
  msRemaining: number;
}

export const LicenseAdminModal: React.FC<LicenseAdminModalProps> = ({
  config,
  onConfigChange,
  onClose,
  msRemaining,
}) => {
  const [activeTab, setActiveTab] = useState<'control' | 'keys' | 'settings' | 'logs'>('control');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Form states
  const [whatsAppInput, setWhatsAppInput] = useState(config.adminWhatsApp);
  const [pinInput, setPinInput] = useState(config.adminPin);
  const [customMsgInput, setCustomMsgInput] = useState(config.customMessage);

  // Custom minutes input
  const [customMinutes, setCustomMinutes] = useState('60');

  // New key generator
  const [newKeyDuration, setNewKeyDuration] = useState('5');
  const [newKeyLabel, setNewKeyLabel] = useState('كود تجريبي');

  const timeFormatted = formatTimeRemaining(msRemaining);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LicenseConfig = {
      ...config,
      adminWhatsApp: whatsAppInput.trim() || '201120194940',
      adminPin: pinInput.trim() || '1234',
      customMessage: customMsgInput.trim() || 'بالرجاء التواصل مع المسؤل علي الواتساب لفتح التطبيق مرة اخري',
    };
    saveLicenseConfig(updated);
    onConfigChange(updated);
    showNotification('تم حفظ الإعدادات بنجاح ✅');
  };

  const handleAddCustomTime = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    const updated = addTimeMinutes(mins, `إضافة مخصصة (${mins} دقيقة)`);
    onConfigChange(updated);
    showNotification(`تمت إضافة ${mins} دقيقة للصلاحية بنجاح ⏱️`);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = parseInt(newKeyDuration, 10) || 5;
    const result = createNewActivationKey(duration, newKeyLabel);
    onConfigChange(result.config);
    showNotification(`تم توليد كود التفعيل: ${result.key} 🔑`);
  };

  return (
    <div 
      id="license-admin-modal-overlay"
      className="fixed inset-0 z-[100000] bg-slate-950/80 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>لوحة التحكم في صلاحيات التطبيق والحجب</span>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono">
                  {config.deviceId}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                التحكم بإضافة 1 يوم أو 5 دقائق أو إيقاف التطبيق وحجبه بالكامل
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Notification */}
        {notice && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs px-5 py-2.5 font-medium text-center animate-fadeIn">
            {notice}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-5 pt-2 bg-slate-950/30 gap-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('control')}
            className={`pb-3 px-3.5 border-b-2 transition cursor-pointer ${
              activeTab === 'control' 
                ? 'border-amber-500 text-amber-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            التحكم السريع والإيقاف
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`pb-3 px-3.5 border-b-2 transition cursor-pointer ${
              activeTab === 'keys' 
                ? 'border-amber-500 text-amber-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            أكواد التفعيل ({config.keys.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3.5 border-b-2 transition cursor-pointer ${
              activeTab === 'settings' 
                ? 'border-amber-500 text-amber-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            إعدادات الواتساب والرسالة
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-3.5 border-b-2 transition cursor-pointer ${
              activeTab === 'logs' 
                ? 'border-amber-500 text-amber-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            سجل العمليات ({config.logs.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200 text-xs flex-1">
          
          {/* TAB 1: QUICK CONTROL */}
          {activeTab === 'control' && (
            <div className="space-y-4">
              {/* Status Overview Card */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${config.isManuallyStopped || msRemaining <= 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
                  <div>
                    <div className="font-bold text-white text-sm">
                      {config.isManuallyStopped 
                        ? '🛑 التطبيق موقوف يدوياً (الشاشة محجوبة بالكامل)' 
                        : msRemaining <= 0 
                        ? '⏳ الصلاحية منتهية (الشاشة محجوبة)' 
                        : '🟢 التطبيق يعمل ومفعل حالياً'}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      الوقت المتبقي: <strong className="text-amber-300 font-mono text-sm">{timeFormatted.formatted}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {config.isManuallyStopped ? (
                    <button
                      onClick={() => {
                        const updated = resumeApplication();
                        onConfigChange(updated);
                        showNotification('تم استئناف تشغيل التطبيق وإلغاء الحجب 🟢');
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>استئناف التطبيق الآن</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const updated = stopApplicationNow('تم الإيقاف اليدوي من لوحة تحكم الترخيص');
                        onConfigChange(updated);
                        showNotification('تم إيقاف التطبيق وحجب الشاشة بالكامل 🛑');
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/40"
                    >
                      <Ban className="w-4 h-4" />
                      <span>وقف التطبيق وحجب الشاشة 🛑</span>
                    </button>
                  )}
                </div>
              </div>

              {/* The Core 3 Actions Requested */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>الإجراءات الأساسية للصلاحية (مباشرة):</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Action 1: Add 5 minutes */}
                  <button
                    onClick={() => {
                      const updated = addTimeMinutes(5, 'إضافة 5 دقائق من لوحة التحكم');
                      onConfigChange(updated);
                      showNotification('تمت إضافة 5 دقائق للصلاحية وفتح التطبيق ⏱️');
                    }}
                    className="p-3 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 rounded-xl text-right transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 font-bold text-sky-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span>+5 دقائق تجريبية</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      تمنح 5 دقائق إضافية لفتح التطبيق، مع مؤقت تنازلي بالثواني.
                    </p>
                  </button>

                  {/* Action 2: Add 1 day */}
                  <button
                    onClick={() => {
                      const updated = addTimeMinutes(1440, 'إضافة يوم كامل (24 ساعة)');
                      onConfigChange(updated);
                      showNotification('تمت إضافة يوم كامل (24 ساعة) للصلاحية وفتح التطبيق 📅');
                    }}
                    className="p-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl text-right transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                      <CalendarPlus className="w-4 h-4" />
                      <span>+1 يوم كامل (24 ساعة)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      تفعيل الصلاحية لـ 24 ساعة كاملة وفتح جميع الميزات.
                    </p>
                  </button>

                  {/* Action 3: Stop App */}
                  <button
                    onClick={() => {
                      const updated = stopApplicationNow('وقف التطبيق من أزرار الصلاحية السريعة');
                      onConfigChange(updated);
                      showNotification('تم وقف التطبيق وحجب الشاشة بالكامل 🛑');
                    }}
                    className="p-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl text-right transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 font-bold text-rose-400 mb-1">
                      <Ban className="w-4 h-4" />
                      <span>وقف التطبيق 🛑</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      حجب الشاشة بالكامل برسالة التواصل عبر واتساب لإعادة الفتح.
                    </p>
                  </button>
                </div>
              </div>

              {/* Custom Minutes Extension */}
              <form onSubmit={handleAddCustomTime} className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 text-right w-full">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    إضافة مدة مخصصة بالدقائق:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="60"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto sm:self-end px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition cursor-pointer shrink-0"
                >
                  إضافة المدة المحددة
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: ACTIVATION KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              {/* Key Generator */}
              <form onSubmit={handleCreateKey} className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl space-y-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>توليد كود تفعيل جديد لإرساله للعميل:</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">نوع الكود والمدة:</label>
                    <select
                      value={newKeyDuration}
                      onChange={(e) => setNewKeyDuration(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                    >
                      <option value="5">5 دقائق تجريبية (KEY-5MIN-XXXX)</option>
                      <option value="1440">يوم كامل / 24 ساعة (KEY-1DAY-XXXX)</option>
                      <option value="43200">شهر كامل / 30 يوم</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">وصف الكود أو اسم العميل:</label>
                    <input
                      type="text"
                      value={newKeyLabel}
                      onChange={(e) => setNewKeyLabel(e.target.value)}
                      placeholder="كود لصديق / عميل تجريبي"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer"
                  >
                    توليد الكود الآن
                  </button>
                </div>
              </form>

              {/* Keys List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-400 text-[11px]">الأكواد المتاحة والسابقة:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {config.keys.map((k) => (
                    <div 
                      key={k.key}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-300 text-xs">{k.key}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            k.isUsed ? 'bg-slate-800 text-slate-500' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {k.isUsed ? 'تم الاستخدام' : 'جاهز للاستخدام'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {k.label} ({k.durationMinutes >= 1440 ? `${k.durationMinutes / 1440} يوم` : `${k.durationMinutes} دقيقة`})
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopy(k.key)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        {copiedKey === k.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === k.key ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>رقم الواتساب الخاص بالمسؤول (بدون أصفار بالصيغة الدولية):</span>
                </label>
                <input
                  type="text"
                  value={whatsAppInput}
                  onChange={(e) => setWhatsAppInput(e.target.value)}
                  placeholder="201120194940"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                  dir="ltr"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  مثال لمصر: 201120194940 (يتم فتح رابط https://wa.me/201120194940 مباشرة عند نقر العميل على زر الواتساب).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>رمز PIN السري لدخول المشرف من شاشة الحجب:</span>
                </label>
                <input
                  type="text"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="1234"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
                  dir="ltr"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  الافتراضي: 1234 (كما تقبل كلمة مرور المشرف 4704600vdlhs@ دائماً).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>الرسالة الظاهرة على كامل شاشة الحجب:</span>
                </label>
                <textarea
                  rows={2}
                  value={customMsgInput}
                  onChange={(e) => setCustomMsgInput(e.target.value)}
                  placeholder="بالرجاء التواصل مع المسؤل علي الواتساب لفتح التطبيق مرة اخري"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-400 text-[11px] mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>سجل أحدث العمليات على الترخيص والصلاحية:</span>
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {config.logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-300">{log.title}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString('ar-EG')}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
