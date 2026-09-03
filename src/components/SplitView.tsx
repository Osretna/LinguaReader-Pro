import React from 'react';
import { AdminPanel } from './AdminPanel';
import { UserAppView } from './UserAppView';
import { SystemState, UserProfile } from '../types';
import { Zap, Monitor, Sliders, ArrowLeftRight } from 'lucide-react';

interface SplitViewProps {
  state: SystemState;
  selectedUserId: string;
  onSelectUserId: (id: string) => void;
  currentUser: UserProfile;
  currentTime: number;
  remainingSeconds: number;
  isExpired: boolean;
  actions: {
    toggleAppLock: (isLocked: boolean, reason?: string) => void;
    activateSubscription: (
      userId: string,
      plan: 'monthly' | 'lifetime' | 'custom' | 'trial_5m',
      durationDays: number,
      planLabel: string,
      customExpiryMs?: number,
    ) => void;
    extendTrialMinutes: (userId: string, minutes?: number) => void;
    expireUserImmediately: (userId: string) => void;
    toggleBan: (userId: string) => void;
    updateUserPermissions: (userId: string, permissions: Partial<UserProfile['permissions']>) => void;
    setBroadcastNotice: (notice: string | null) => void;
    resetToDefault: () => void;
  };
}

export const SplitView: React.FC<SplitViewProps> = ({
  state,
  selectedUserId,
  onSelectUserId,
  currentUser,
  currentTime,
  remainingSeconds,
  isExpired,
  actions,
}) => {
  return (
    <div id="split-view-container" className="space-y-4">
      {/* Real-time Guide & User Selector Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-indigo-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/50 border border-indigo-400/40 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-amber-300 animate-bounce" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5 text-indigo-200">
              <span>وضع المقارنة اللحظية المباشرة (Split Real-time Screen)</span>
              <span className="bg-indigo-800 text-[10px] px-2 py-0.5 rounded-full">0ms ريفريش</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              اضغط على أزرار الأدمن على اليمين وراقب شاشة المستخدم على اليسار كيف تستجيب فوراً بدون إعادة تحميل!
            </p>
          </div>
        </div>

        {/* User switcher for split view */}
        <div className="flex items-center gap-2 w-full md:w-auto bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 text-xs">
          <span className="text-slate-400 font-medium px-2 shrink-0">المستخدم المعروض:</span>
          <select
            id="select-user-split"
            value={selectedUserId}
            onChange={(e) => onSelectUserId(e.target.value)}
            className="bg-slate-900 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden cursor-pointer"
          >
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.planLabel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Columns Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Right Column (7 cols): Admin Panel */}
        <div className="xl:col-span-7 bg-slate-100/70 p-4 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>لوحة تحكم الأدمن (مصدر الأوامر اللحظية)</span>
            </div>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">
              مرسل الأوامر ⚡
            </span>
          </div>
          <AdminPanel state={state} currentTime={currentTime} actions={actions} />
        </div>

        {/* Left Column (5 cols): User Live View */}
        <div className="xl:col-span-5 bg-slate-100/70 p-4 rounded-3xl border border-slate-200/80 shadow-xs sticky top-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Monitor className="w-4 h-4 text-emerald-600" />
              <span>شاشة المستخدم الحية: {currentUser.name}</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              مستمع فوري
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <UserAppView
              user={currentUser}
              systemState={state}
              currentTime={currentTime}
              remainingSeconds={remainingSeconds}
              isExpired={isExpired}
              onSimulateExtendFromAdmin={() => actions.extendTrialMinutes(currentUser.id, 5)}
              onSimulateMonthFromAdmin={() =>
                actions.activateSubscription(currentUser.id, 'monthly', 30, 'شهر (100 ج.م)')
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
