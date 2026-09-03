import React, { useState } from 'react';
import { UserProfile } from '../types';
import { logOut } from '../firebase';
import { 
  Clock, 
  Copy, 
  Check, 
  Send, 
  LogOut, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw,
  MessageSquare
} from 'lucide-react';

interface PendingApprovalViewProps {
  userProfile: UserProfile;
  onRefresh?: () => void;
}

export const PendingApprovalView: React.FC<PendingApprovalViewProps> = ({ userProfile, onRefresh }) => {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(userProfile.email || userProfile.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleManualCheck = () => {
    setChecking(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setChecking(false), 1200);
  };

  // رسالة واتساب جاهزة للإرسال للمشرف
  const whatsappMessage = encodeURIComponent(
    `مرحباً، قمت بتسجيل الدخول في تطبيق LinguaReader Pro وأرجو تفعيل حسابي.\nالبريد: ${userProfile.email || 'غير محدد'}\nمعرف المستخدم (UID): ${userProfile.uid}`
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
        {/* Top status bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 animate-pulse"></div>

        {/* User Avatar */}
        <div className="relative inline-block mb-4">
          {userProfile.photoURL ? (
            <img 
              src={userProfile.photoURL} 
              alt={userProfile.displayName || 'User'} 
              className="w-20 h-20 rounded-full border-2 border-amber-500/60 p-1 mx-auto shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-amber-500/60 flex items-center justify-center mx-auto text-2xl font-bold text-amber-400 shadow-md">
              {(userProfile.displayName || userProfile.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className="absolute bottom-0 right-0 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow">
            <Clock className="w-4 h-4" />
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">
          أهلاً بك، {userProfile.displayName || 'صديقنا القارئ'}
        </h2>
        <p className="text-sm text-slate-400 mb-6 dir-ltr font-mono">
          {userProfile.email}
        </p>

        {/* Pending Badge Box */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-right">
          <div className="flex items-center gap-2.5 text-amber-400 font-semibold mb-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>الحساب في انتظار موافقة المشرف للتفعيل</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            تم تسجيل بياناتك بنجاح في قاعدة بيانات الفيربيس (Firebase). التطبيق يستمع الآن بشكل لحظي وتلقائي، وبمجرد أن يقوم المشرف بالضغط على زر 
            <span className="text-amber-300 font-bold mx-1">"تفعيل الحساب"</span>
            من لوحة الإدارة ستفتح لك شاشة القراءة فوراً دون الحاجة لإعادة التسجيل.
          </p>
        </div>

        {/* User Identifiers for Admin */}
        <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/70 mb-6 text-right">
          <div className="text-xs text-slate-400 mb-1.5 flex justify-between items-center">
            <span>البريد الإلكتروني / معرف الحساب (UID):</span>
            <button
              onClick={handleCopyUid}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ للمشرف</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-slate-900/90 rounded-lg p-2.5 font-mono text-xs text-slate-200 break-all select-all border border-slate-700/50 text-left" dir="ltr">
            {userProfile.email || userProfile.uid}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <MessageSquare className="w-4 h-4" />
            <span>طلب التفعيل الفوري عبر واتساب</span>
          </a>

          <div className="flex gap-3">
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{checking ? 'جارٍ الفحص...' : 'فحص حالة التفعيل الآن'}</span>
            </button>

            <button
              onClick={() => logOut()}
              className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Live sync pulse */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span>متصل بـ Firebase Real-time Sync (مزامنة مباشرة)</span>
        </div>
      </div>
    </div>
  );
};
