import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  RotateCcw,
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Clock,
  Zap,
  Sparkles,
  Download,
  BarChart3,
  Users,
  HardDrive,
} from 'lucide-react';

interface UserRowProps {
  user: UserProfile;
  currentTime: number;
  onActivateMonth: (userId: string) => void;
  onActivateLifetime: (userId: string) => void;
  onActivateCustomDays: (userId: string, days: number) => void;
  onResetOrRenew: (userId: string) => void;
  onToggleBan: (userId: string) => void;
  onUpdatePermissions: (userId: string, permissions: Partial<UserProfile['permissions']>) => void;
  onExtend5Minutes: (userId: string) => void;
  onExpireNow: (userId: string) => void;
}

export const UserRow: React.FC<UserRowProps> = ({
  user,
  currentTime,
  onActivateMonth,
  onActivateLifetime,
  onActivateCustomDays,
  onResetOrRenew,
  onToggleBan,
  onUpdatePermissions,
  onExtend5Minutes,
  onExpireNow,
}) => {
  const [showCustomDaysModal, setShowCustomDaysModal] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState('14');
  const [showPermissions, setShowPermissions] = useState(false);

  // Format expiration text
  const isTrial = user.plan === 'trial_5m';
  const remainingSeconds = Math.max(0, Math.floor((user.expiresAt - currentTime) / 1000));
  const isExpired = user.status === 'expired' || remainingSeconds <= 0;

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

  // Badge configuration matching the screenshot style
  let badgeLabel = 'مشترك نشط';
  let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';

  if (user.isBanned) {
    badgeLabel = 'محظور من الخدمة';
    badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
  } else if (isExpired) {
    badgeLabel = 'منتهي الصلاحية';
    badgeClass = 'bg-slate-200 text-slate-700 border-slate-300';
  } else if (isTrial) {
    badgeLabel = `تجريبي (${formatCountdown(remainingSeconds)})`;
    badgeClass = 'bg-sky-100 text-sky-800 border-sky-200 animate-pulse';
  } else if (user.plan === 'lifetime') {
    badgeLabel = 'مشترك مدى الحياة';
    badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
  }

  const handleApplyCustomDays = () => {
    const days = parseInt(customDaysInput, 10);
    if (!isNaN(days) && days > 0) {
      onActivateCustomDays(user.id, days);
      setShowCustomDaysModal(false);
    }
  };

  return (
    <div
      id={`user-card-${user.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 transition-all duration-200 hover:shadow-md"
    >
      {/* Exact UI Row from screenshot */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left Side (Action Buttons matching screenshot) */}
        <div className="flex items-center flex-wrap gap-2 order-2 lg:order-1">
          {/* Ban/Block Button (Red rounded icon button) */}
          <button
            id={`btn-ban-${user.id}`}
            onClick={() => onToggleBan(user.id)}
            title={user.isBanned ? 'إلغاء حظر المستخدم' : 'حظر / إيقاف المستخدم'}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
              user.isBanned
                ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Ban className="w-4 h-4" />
          </button>

          {/* Reset/Refresh Button (Blue rounded icon button) */}
          <button
            id={`btn-reset-${user.id}`}
            onClick={() => onResetOrRenew(user.id)}
            title="تجديد الصلاحية وإعادة الضبط"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Custom Days Button */}
          <div className="relative">
            <button
              id={`btn-custom-days-${user.id}`}
              onClick={() => setShowCustomDaysModal(!showCustomDaysModal)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
            >
              تحديد أيام...
            </button>

            {/* Custom Days Popover */}
            {showCustomDaysModal && (
              <div
                id={`modal-custom-days-${user.id}`}
                className="absolute z-30 top-full mt-2 right-0 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 animate-in fade-in zoom-in-95"
              >
                <div className="text-xs font-bold text-slate-700 mb-2">حدد عدد أيام الصلاحية:</div>
                <div className="flex gap-1.5 mb-2.5">
                  {[3, 7, 15, 30].map((d) => (
                    <button
                      key={d}
                      id={`btn-preset-days-${d}`}
                      onClick={() => {
                        onActivateCustomDays(user.id, d);
                        setShowCustomDaysModal(false);
                      }}
                      className="flex-1 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium transition-colors cursor-pointer"
                    >
                      {d} يوماً
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    id={`input-custom-days-${user.id}`}
                    type="number"
                    min="1"
                    max="365"
                    value={customDaysInput}
                    onChange={(e) => setCustomDaysInput(e.target.value)}
                    className="w-20 px-2 py-1 text-xs border rounded-lg border-slate-300 text-center font-mono"
                  />
                  <button
                    id={`btn-apply-custom-days-${user.id}`}
                    onClick={handleApplyCustomDays}
                    className="flex-1 py-1 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors cursor-pointer"
                  >
                    تطبيق فوراً
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lifetime Button */}
          <button
            id={`btn-lifetime-${user.id}`}
            onClick={() => onActivateLifetime(user.id)}
            className="px-3.5 py-1.5 rounded-xl border border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            مدى الحياة
          </button>

          {/* Month Button (100 EGP) */}
          <button
            id={`btn-month-${user.id}`}
            onClick={() => onActivateMonth(user.id)}
            className="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            شهر (100 ج.م)
          </button>
        </div>

        {/* Right Side (User Info matching screenshot) */}
        <div className="flex items-center gap-3.5 order-1 lg:order-2 justify-between lg:justify-end">
          <div className="text-right flex flex-col items-start lg:items-end">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                {badgeLabel}
              </span>
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                {user.name}
              </span>
            </div>

            <div className="text-slate-500 text-xs sm:text-sm font-mono dir-ltr mt-0.5">
              {user.email}
            </div>

            <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-1 font-sans">
              {isTrial && !isExpired ? (
                <span className="text-sky-700 font-medium">
                  متبقي في الفترة التجريبية: {formatCountdown(remainingSeconds)}
                </span>
              ) : (
                <span>
                  ينتهي في: {user.plan === 'lifetime' ? 'غير محدود (مدى الحياة)' : formatExpiryDate(user.expiresAt)}
                </span>
              )}
            </div>
          </div>

          {/* Avatar (orange circle with letter 't') */}
          <div
            className={`w-11 h-11 rounded-full ${user.avatarBg} text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-sm`}
          >
            {user.avatar}
          </div>
        </div>
      </div>

      {/* Quick Testing & Permissions Toolbar */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center flex-wrap gap-2">
          {/* 5-minute Trial Trigger */}
          <button
            id={`btn-trial-5m-${user.id}`}
            onClick={() => onExtend5Minutes(user.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 font-medium transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            تفعيل فترة تجريبية (5 دقائق)
          </button>

          {/* Force Expire Button to test instant screen lock */}
          <button
            id={`btn-expire-now-${user.id}`}
            onClick={() => onExpireNow(user.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-medium transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            إنهاء الصلاحية فوراً (لاختبار القفل اللحظي)
          </button>
        </div>

        {/* Permissions Accordion Toggle */}
        <button
          id={`btn-toggle-permissions-${user.id}`}
          onClick={() => setShowPermissions(!showPermissions)}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>صلاحيات المستخدم الخاصة</span>
          {showPermissions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Permissions Section */}
      {showPermissions && (
        <div
          id={`permissions-panel-${user.id}`}
          className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 animate-in fade-in duration-150"
        >
          <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
            <span>الصلاحيات الممنوحة للمستخدم (تتغير عند المستخدم لحظياً بدون ريفريش):</span>
            <span className="text-[10px] text-emerald-700 font-normal">مزامنة فورية ⚡</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {/* AI Permission */}
            <label
              id={`perm-label-ai-${user.id}`}
              className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                user.permissions.canUseAI
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <input
                id={`perm-ai-${user.id}`}
                type="checkbox"
                checked={user.permissions.canUseAI}
                onChange={(e) => onUpdatePermissions(user.id, { canUseAI: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs font-medium">أدوات الذكاء الاصطناعي</div>
            </label>

            {/* Export Data Permission */}
            <label
              id={`perm-label-export-${user.id}`}
              className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                user.permissions.canExportData
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <input
                id={`perm-export-${user.id}`}
                type="checkbox"
                checked={user.permissions.canExportData}
                onChange={(e) => onUpdatePermissions(user.id, { canExportData: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <Download className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs font-medium">تصدير التقارير والملفات</div>
            </label>

            {/* Reports Analytics Permission */}
            <label
              id={`perm-label-reports-${user.id}`}
              className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                user.permissions.canAccessReports
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <input
                id={`perm-reports-${user.id}`}
                type="checkbox"
                checked={user.permissions.canAccessReports}
                onChange={(e) => onUpdatePermissions(user.id, { canAccessReports: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs font-medium">التقارير والإحصائيات</div>
            </label>

            {/* Team Management */}
            <label
              id={`perm-label-team-${user.id}`}
              className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                user.permissions.canManageTeam
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <input
                id={`perm-team-${user.id}`}
                type="checkbox"
                checked={user.permissions.canManageTeam}
                onChange={(e) => onUpdatePermissions(user.id, { canManageTeam: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs font-medium">إدارة أعضاء الفريق</div>
            </label>

            {/* Unlimited Storage */}
            <label
              id={`perm-label-storage-${user.id}`}
              className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors cursor-pointer ${
                user.permissions.unlimitedStorage
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <input
                id={`perm-storage-${user.id}`}
                type="checkbox"
                checked={user.permissions.unlimitedStorage}
                onChange={(e) => onUpdatePermissions(user.id, { unlimitedStorage: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <HardDrive className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs font-medium">مساحة سحابية مفتوحة</div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
