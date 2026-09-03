import React, { useState } from 'react';
import { UserProfile, SystemState } from '../types';
import {
  ShieldAlert,
  Clock,
  Sparkles,
  Download,
  BarChart3,
  Users,
  HardDrive,
  Lock,
  CheckCircle2,
  Radio,
  FileSpreadsheet,
  FileJson,
  Zap,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';

interface UserAppViewProps {
  user: UserProfile;
  systemState: SystemState;
  currentTime: number;
  remainingSeconds: number;
  isExpired: boolean;
  onSimulateExtendFromAdmin?: () => void;
  onSimulateMonthFromAdmin?: () => void;
}

export const UserAppView: React.FC<UserAppViewProps> = ({
  user,
  systemState,
  remainingSeconds,
  isExpired,
  onSimulateExtendFromAdmin,
  onSimulateMonthFromAdmin,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Countdown string
  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatExpiryDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}/${month}/${day}`;
  };

  const handleRunAi = (promptText?: string) => {
    const textToRun = promptText || aiPrompt;
    if (!textToRun.trim() || !user.permissions.canUseAI) return;

    setIsAiLoading(true);
    setAiResponse(null);

    setTimeout(() => {
      setIsAiLoading(false);
      setAiResponse(
        `تمت معالجة الطلب بنجاح في الوقت الفعلي: "${textToRun}". النظام يعمل بصلاحيات متزامنة لحظياً، والنتائج جاهزة للاستخدام الفوري.`
      );
    }, 600);
  };

  const handleExportData = (type: 'csv' | 'json') => {
    if (!user.permissions.canExportData) return;

    const data = [
      { id: 1, name: 'سجل العمليات 101', date: '2026-10-01', status: 'مكتمل', amount: '250 ج.م' },
      { id: 2, name: 'سجل المعاملات 102', date: '2026-10-02', status: 'مكتمل', amount: '450 ج.م' },
      { id: 3, name: 'سجل الاشتراكات 103', date: '2026-10-03', status: 'نشط', amount: '100 ج.م' },
    ];

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: type === 'csv' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_المستخدم_${user.name.replace(/\s+/g, '_')}.${type}`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloadSuccess(`تم تصدير ملف الـ ${type.toUpperCase()} بنجاح!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 1. GLOBAL APP LOCK (عند إغلاق التطبيق كلياً من قبل الإدارة)
  if (systemState.isAppLocked) {
    return (
      <div
        id="screen-app-locked"
        className="min-h-[500px] flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-2xl shadow-xl border border-rose-900/50 text-center animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-rose-950/80 border-2 border-rose-500 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-950/50 animate-pulse">
            <Lock className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
          </span>
        </div>

        <h2 className="text-2xl font-black text-white mb-2">تم إغلاق التطبيق بواسطة الإدارة</h2>

        <p className="text-sm text-rose-200 bg-rose-950/60 border border-rose-800/80 px-4 py-2.5 rounded-xl max-w-md mx-auto mb-5 leading-relaxed">
          {systemState.lockReason || 'تم إيقاف الخدمة مؤقتاً لأعمال الصيانة والتحديثات الإدارية.'}
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>المزامنة اللحظية مستمرة: سيتم فتح الشاشة فوراً عند إلغاء القفل بدون أي ريفريش</span>
        </div>
      </div>
    );
  }

  // 2. USER BANNED (عند حظر المستخدم)
  if (user.isBanned) {
    return (
      <div
        id="screen-user-banned"
        className="min-h-[500px] flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl border border-rose-200 text-center animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">تم إيقاف حسابك مؤقتاً</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">
          تم حظر وصول حسابك ({user.email}) بواسطة إدارة النظام. يتم الاستماع للخادم لحظياً وسيتم
          استئناف وصولك فور رفع الحظر من الإدارة.
        </p>
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>بانتظار موافقة الإدارة (تحديث لحظي بدون ريفريش)...</span>
        </div>
      </div>
    );
  }

  // 3. TRIAL EXPIRED (فترة الصلاحية الـ 5 دقائق انتهت)
  if (isExpired) {
    return (
      <div
        id="screen-trial-expired"
        className="min-h-[520px] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-50/70 to-white rounded-2xl shadow-lg border border-amber-200 text-center animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="relative mb-4">
          <div className="w-18 h-18 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 shadow-sm">
            <Clock className="w-9 h-9" />
          </div>
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            00:00
          </span>
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-2">
          انتهت فترة الصلاحية التجريبية (5 دقائق)
        </h2>

        <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
          انتهت فترة الصلاحية المحددة لحسابك. <strong className="text-slate-900">لا حاجة نهائياً لعمل ريفريش للصفحة</strong>؛ بمجرد قيام الأدمن بتفعيل الاشتراك أو تجديد الصلاحية من لوحة التحكم، سيتم فتح التطبيق لديك لحظياً في هذا الإطار مباشرة!
        </p>

        {/* Live waiting indicator */}
        <div className="bg-amber-100/80 border border-amber-300 text-amber-900 px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 mb-6 shadow-xs">
          <Radio className="w-4 h-4 text-amber-600 animate-pulse" />
          <span>الاتصال الفوري نشط: في انتظار أمر التفعيل من لوحة تحكم الأدمن...</span>
        </div>

        {/* Quick Demo Shortcuts for instant testing */}
        {(onSimulateExtendFromAdmin || onSimulateMonthFromAdmin) && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs max-w-md w-full">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>أزرار سريعة لتجربة التفعيل من الأدمن فوراً:</span>
            </div>
            <div className="flex gap-2">
              {onSimulateExtendFromAdmin && (
                <button
                  id="btn-simulate-extend-5m"
                  onClick={onSimulateExtendFromAdmin}
                  className="flex-1 py-2 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  ⚡ تفعيل 5 دقائق جديدة
                </button>
              )}
              {onSimulateMonthFromAdmin && (
                <button
                  id="btn-simulate-month"
                  onClick={onSimulateMonthFromAdmin}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  ✨ تفعيل شهر (100 ج.م)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. ACTIVE WORKSPACE (المستخدم نشط ولديه صلاحيات)
  return (
    <div id="user-app-active-workspace" className="space-y-5 animate-in fade-in duration-200">
      {/* Broadcast Banner if set by Admin */}
      {systemState.broadcastNotice && (
        <div
          id="user-broadcast-banner"
          className="bg-indigo-600 text-white p-3 rounded-xl shadow-md flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top duration-300"
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-200 animate-pulse shrink-0" />
            <span className="font-semibold">تنبيه إداري فوري:</span>
            <span>{systemState.broadcastNotice}</span>
          </div>
          <span className="text-[10px] bg-indigo-700 px-2 py-0.5 rounded-full shrink-0">مباشر</span>
        </div>
      )}

      {/* Subscription Active Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${user.avatarBg} text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs`}
          >
            {user.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base">{user.name}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {user.plan === 'lifetime'
                  ? 'مشترك مدى الحياة'
                  : user.plan === 'trial_5m'
                  ? 'فترة تجريبية سارية'
                  : 'مشترك نشط'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono dir-ltr mt-0.5">{user.email}</div>
          </div>
        </div>

        {/* Validity Period Display */}
        <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 text-xs flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {user.plan === 'trial_5m' ? (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600 animate-spin" />
              <div>
                <div className="text-[10px] text-slate-500 font-medium">الوقت المتبقي في الـ 5 دقائق:</div>
                <div className="font-mono font-bold text-sky-700 text-sm">
                  {formatCountdown(remainingSeconds)}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[10px] text-slate-500 font-medium">حالة الاشتراك:</div>
              <div className="font-bold text-slate-800">
                {user.plan === 'lifetime'
                  ? 'مدى الحياة (مفتوح)'
                  : `ينتهي في: ${formatExpiryDate(user.expiresAt)}`}
              </div>
            </div>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="متزامن لحظياً"></span>
        </div>
      </div>

      {/* Workspace Feature Modules Governed by Admin Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module 1: AI Assistant (أدوات الذكاء الاصطناعي) */}
        <div
          id="module-ai-assistant"
          className={`rounded-2xl border p-4 transition-all duration-200 relative overflow-hidden ${
            user.permissions.canUseAI
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-slate-50/80 border-dashed border-slate-300 opacity-80'
          }`}
        >
          {!user.permissions.canUseAI && (
            <div className="absolute inset-0 bg-slate-100/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-800">ميزة الذكاء الاصطناعي معطلة</div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                يقوم الأدمن بإدارتها من لوحة التحكم. بمجرد تفعيلها ستفتح أمامك في الحال بدون ريفريش!
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">المساعد الذكي (AI Studio)</h3>
                <span className="text-[10px] text-slate-400">توليد وتحليل البيانات الذكية</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                user.permissions.canUseAI
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {user.permissions.canUseAI ? 'مفعل بالصلاحيات' : 'مقفل'}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex gap-2">
              <input
                id="input-ai-prompt"
                type="text"
                disabled={!user.permissions.canUseAI}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="اكتب أمراً للمساعد الذكي..."
                className="flex-1 px-3 py-1.5 text-xs border rounded-xl border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
              />
              <button
                id="btn-run-ai"
                disabled={!user.permissions.canUseAI || isAiLoading}
                onClick={() => handleRunAi()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isAiLoading ? 'جاري التحليل...' : 'تنفيذ'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['ملخص الإيرادات', 'صياغة تقرير شهري', 'اقتراحات التطوير'].map((suggestion) => (
                <button
                  key={suggestion}
                  disabled={!user.permissions.canUseAI}
                  onClick={() => {
                    setAiPrompt(suggestion);
                    handleRunAi(suggestion);
                  }}
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {aiResponse && (
              <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950 animate-in fade-in">
                {aiResponse}
              </div>
            )}
          </div>
        </div>

        {/* Module 2: Data Export (تصدير التقارير والبيانات) */}
        <div
          id="module-data-export"
          className={`rounded-2xl border p-4 transition-all duration-200 relative overflow-hidden ${
            user.permissions.canExportData
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-slate-50/80 border-dashed border-slate-300 opacity-80'
          }`}
        >
          {!user.permissions.canExportData && (
            <div className="absolute inset-0 bg-slate-100/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-800">صلاحية التصدير معطلة</div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                تحتاج تفعيل خيار "تصدير التقارير والملفات" من لوحة تحكم الأدمن.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">تصدير التقارير والبيانات</h3>
                <span className="text-[10px] text-slate-400">تحميل ملفات Excel و JSON</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                user.permissions.canExportData
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {user.permissions.canExportData ? 'صلاحية نشطة' : 'مقفل'}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              يمكنك تصدير كشوفات الحسابات وسجلات المعاملات مباشرة بصيغ متوافقة مع أنظمة المحاسبة:
            </p>

            <div className="flex gap-2">
              <button
                id="btn-export-csv"
                disabled={!user.permissions.canExportData}
                onClick={() => handleExportData('csv')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>تصدير CSV (Excel)</span>
              </button>

              <button
                id="btn-export-json"
                disabled={!user.permissions.canExportData}
                onClick={() => handleExportData('json')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 disabled:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>تصدير JSON</span>
              </button>
            </div>

            {downloadSuccess && (
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-800 text-xs font-semibold text-center border border-emerald-200 animate-in fade-in">
                {downloadSuccess}
              </div>
            )}
          </div>
        </div>

        {/* Module 3: Advanced Reports & Analytics */}
        <div
          id="module-analytics-reports"
          className={`rounded-2xl border p-4 transition-all duration-200 relative overflow-hidden ${
            user.permissions.canAccessReports
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-slate-50/80 border-dashed border-slate-300 opacity-80'
          }`}
        >
          {!user.permissions.canAccessReports && (
            <div className="absolute inset-0 bg-slate-100/70 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-800">التقارير المتقدمة معطلة</div>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                فعل ميزة "التقارير والإحصائيات" من لوحة الأدمن لفتحها فوراً.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">مؤشرات الأداء المباشرة</h3>
                <span className="text-[10px] text-slate-400">تحليلات الأرباح والمبيعات</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                user.permissions.canAccessReports
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {user.permissions.canAccessReports ? 'مفعل' : 'مقفل'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500">إجمالي العمليات</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">1,420 عملية</div>
              <div className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+14.5% هذا الشهر</span>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500">معدل التحويل</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">98.2%</div>
              <div className="text-[10px] text-sky-600 mt-1">استجابة سريعة</div>
            </div>
          </div>
        </div>

        {/* Module 4: Cloud Storage & Team Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">حالة التخزين والخدمات</h3>
                <span className="text-[10px] text-slate-400">إمكانيات الحساب الحالية</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>سعة التخزين السحابية</span>
              </div>
              <span className="font-bold text-purple-700">
                {user.permissions.unlimitedStorage ? 'غير محدودة (Unlimited)' : '50 جيجابايت'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>إدارة فريق العمل</span>
              </div>
              <span className="font-bold text-slate-700">
                {user.permissions.canManageTeam ? 'متاح (حساب مسؤول)' : 'مستخدم فردي'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
