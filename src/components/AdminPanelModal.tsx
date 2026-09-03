import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  KeyRound, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  PlusCircle, 
  RotateCcw, 
  Ban, 
  Sparkles, 
  Search,
  MessageCircle,
  ExternalLink,
  Crown,
  Database,
  Cloud,
  FileCode2,
  Check,
  RefreshCw
} from 'lucide-react';
import { 
  AuthService, 
  OWNER_EMAIL, 
  OWNER_PHONE, 
  MONTHLY_PRICE_EGP 
} from '../services/auth';
import { FirebaseService, isFirebaseConfigured, firebaseConfig } from '../services/firebase';
import { AuthUser, LicenseKey, SubscriptionPlan } from '../types';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onRefreshData: () => void;
  isArabic: boolean;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRefreshData,
  isArabic,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'licenses' | 'guide' | 'firebase'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedFirebaseSnippet, setCopiedFirebaseSnippet] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  
  // Custom days input state
  const [customDaysTargetId, setCustomDaysTargetId] = useState<string | null>(null);
  const [customDaysValue, setCustomDaysValue] = useState('30');
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New License Generator state
  const [newLicensePlan, setNewLicensePlan] = useState<SubscriptionPlan>('monthly');
  const [newLicenseDays, setNewLicenseDays] = useState('30');

  // Add user manually state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPermission, setNewPermission] = useState<'30' | '90' | '365' | 'lifetime'>('30');

  // Master Password Authentication state
  const [sessionAuthenticated, setSessionAuthenticated] = useState<boolean>(() => {
    return AuthService.isAdminSessionAuthenticated();
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Global App Lock & Broadcast state (Instant realtime kill switch)
  const [isAppLockedGlobally, setIsAppLockedGlobally] = useState<boolean>(false);
  const [lockReasonInput, setLockReasonInput] = useState<string>('تم إغلاق التطبيق بواسطة الإدارة لأعمال الصيانة والتحديثات');
  const [isTogglingLock, setIsTogglingLock] = useState<boolean>(false);
  const [broadcastInput, setBroadcastInput] = useState<string>('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);

  // Live Cloud Users state from Firebase
  const [cloudUsers, setCloudUsers] = useState<AuthUser[] | null>(null);
  const isCloudConnected = FirebaseService.isConnected();

  useEffect(() => {
    if (!isOpen || !sessionAuthenticated) return;
    
    // Listen to global app lock state in real time
    const unsubGlobal = FirebaseService.listenToGlobalAppState((state) => {
      setIsAppLockedGlobally(state.isAppLocked);
      if (state.lockReason) {
        setLockReasonInput(state.lockReason);
      }
    });

    let unsubUsers: (() => void) | null = null;
    if (isCloudConnected) {
      unsubUsers = FirebaseService.subscribeToCloudUsers((users) => {
        setCloudUsers(users);
      });
    }

    return () => {
      unsubGlobal?.();
      unsubUsers?.();
    };
  }, [isOpen, sessionAuthenticated, isCloudConnected]);

  if (!isOpen) return null;

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (AuthService.verifyAdminPassword(adminPasswordInput)) {
      AuthService.setAdminSessionAuthenticated();
      setSessionAuthenticated(true);
      setPasswordError(null);
    } else {
      setPasswordError(isArabic ? 'كلمة المرور غير صحيحة! الوصول مقيد لمصمم التطبيق فقط.' : 'Incorrect password');
    }
  };

  const allUsers = (cloudUsers && cloudUsers.length > 0) ? cloudUsers : AuthService.getAllUsers();
  const allLicenses = AuthService.getAllLicenseKeys();

  const filteredUsers = allUsers.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGrantPermission = async (userOrId: AuthUser | string, duration: 'lifetime' | number) => {
    const userObj = typeof userOrId === 'object' && userOrId !== null ? userOrId : (
      (cloudUsers || []).find(u => u.id === userOrId || u.email.toLowerCase() === (userOrId as string).toLowerCase()) ||
      AuthService.getAllUsers().find(u => u.id === userOrId || u.email.toLowerCase() === (userOrId as string).toLowerCase())
    );

    if (!userObj) {
      setNotice({ text: 'المستخدم غير موجود', type: 'error' });
      return;
    }

    const res = AuthService.grantUserPermission(userObj, duration, 'مدير التطبيق');
    if (res.success && res.user) {
      // Direct Firebase update in real time with full user payload and email indexing
      await FirebaseService.syncUserToCloud(res.user);
      await FirebaseService.updateUserSubscription(res.user.id, res.user.subscription, res.user, res.user.email);
      
      // Update local cloud state immediately
      setCloudUsers(prev => prev ? prev.map(u => u.id === res.user!.id ? res.user! : u) : [res.user!]);
      
      setNotice({ text: duration === 'lifetime' ? 'تم تفعيل الوصول الدائم مدى الحياة بنجاح 🟢 وتطبيقه لحظياً عند المشترك' : `تم تفعيل الاشتراك لمدة ${duration} يوم (100 ج.م) بنجاح 🟢 وتطبيقه لحظياً عند المشترك`, type: 'success' });
      onRefreshData();
    } else {
      setNotice({ text: res.message, type: 'error' });
    }
  };

  const handleResetTrial = async (userOrId: AuthUser | string) => {
    const userObj = typeof userOrId === 'object' && userOrId !== null ? userOrId : (
      (cloudUsers || []).find(u => u.id === userOrId || u.email.toLowerCase() === (userOrId as string).toLowerCase()) ||
      AuthService.getAllUsers().find(u => u.id === userOrId || u.email.toLowerCase() === (userOrId as string).toLowerCase())
    );

    if (!userObj) {
      setNotice({ text: 'المستخدم غير موجود', type: 'error' });
      return;
    }

    const ok = AuthService.resetUserTrial(userObj);
    if (ok) {
      const trialEndsAt = new Date(Date.now() + 300 * 1000).toISOString();
      const updatedUser: AuthUser = {
        ...userObj,
        subscription: {
          ...userObj.subscription,
          status: 'trial',
          isExpired: false,
          trialSecondsTotal: 300,
          trialSecondsRemaining: 300,
          trialEndsAt: trialEndsAt,
          notes: 'تم تجديد 5 دقائق تجربة مجانية بواسطة المدير',
        }
      };
      await FirebaseService.syncUserToCloud(updatedUser);
      await FirebaseService.updateUserSubscription(updatedUser.id, updatedUser.subscription, updatedUser, updatedUser.email);
      
      setCloudUsers(prev => prev ? prev.map(u => u.id === updatedUser.id ? updatedUser : u) : [updatedUser]);
      setNotice({ text: 'تمت إعادة 5 دقائق تجربة مجانية وتطبيقها لحظياً عند المشترك بدون ريفريش 🟢', type: 'success' });
      onRefreshData();
    } else {
      setNotice({ text: 'تعذر تجديد التجربة للمستخدم', type: 'error' });
    }
  };

  const handleRevoke = async (userOrId: AuthUser | string) => {
    const userObj = typeof userOrId === 'object' && userOrId !== null ? userOrId : (
      (cloudUsers || []).find(u => u.id === userOrId || u.email.toLowerCase() === (userOrId as string).toLowerCase()) ||
      AuthService.getAllUsers().find(u => u.id === userOrId || u.email.toLowerCase() === (userOrId as string).toLowerCase())
    );

    if (!userObj) {
      setNotice({ text: 'المستخدم غير موجود', type: 'error' });
      return;
    }

    const ok = AuthService.revokeUserAccess(userObj);
    if (ok) {
      const updatedUser: AuthUser = {
        ...userObj,
        subscription: {
          ...userObj.subscription,
          status: 'expired',
          isExpired: true,
          trialSecondsRemaining: 0,
          trialEndsAt: new Date().toISOString(),
          notes: 'تم إيقاف الحساب وقفل التطبيق بواسطة المدير',
        }
      };
      await FirebaseService.syncUserToCloud(updatedUser);
      await FirebaseService.updateUserSubscription(updatedUser.id, updatedUser.subscription, updatedUser, updatedUser.email);
      
      setCloudUsers(prev => prev ? prev.map(u => u.id === updatedUser.id ? updatedUser : u) : [updatedUser]);
      setNotice({ text: 'تم إيقاف صلاحية المستخدم وقفل التطبيق عليه فوراً ولحظياً 🔴', type: 'success' });
      onRefreshData();
    }
  };

  const handleToggleGlobalLock = async () => {
    setIsTogglingLock(true);
    const nextLocked = !isAppLockedGlobally;
    try {
      await FirebaseService.setGlobalAppLock(nextLocked, lockReasonInput, currentUser?.email || 'admin');
      setIsAppLockedGlobally(nextLocked);
      setNotice({
        text: nextLocked 
          ? 'تم قفل التطبيق بالكامل عن جميع المستخدمين لحظياً 🔒' 
          : 'تم فتح وإلغاء قفل التطبيق لجميع المستخدمين لحظياً 🟢',
        type: 'success',
      });
    } catch (e) {
      setNotice({ text: 'فشل تغيير حالة قفل التطبيق', type: 'error' });
    } finally {
      setIsTogglingLock(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastInput.trim()) return;
    setIsSendingBroadcast(true);
    try {
      await FirebaseService.setGlobalBroadcastNotice(broadcastInput.trim());
      setNotice({ text: 'تم إرسال التنبيه العام لحظياً لجميع المستخدمين 📢', type: 'success' });
      setBroadcastInput('');
    } catch (e) {
      setNotice({ text: 'فشل إرسال التنبيه', type: 'error' });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleCreateLicense = () => {
    const days = newLicensePlan === 'monthly' ? 30 : parseInt(newLicenseDays) || 30;
    const key = AuthService.generateNewLicenseKey(newLicensePlan, days);
    setNotice({ text: `تم توليد كود التفعيل بنجاح: ${key.code}`, type: 'success' });
    onRefreshData();
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleAddManualUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setNotice({ text: 'يرجى كتابة بريد إلكتروني صحيح', type: 'error' });
      return;
    }

    const created = AuthService.signInWithGoogle({
      email: newEmail.trim().toLowerCase(),
      name: newName || newEmail.split('@')[0],
    });

    if (newPermission === 'lifetime') {
      AuthService.grantUserPermission(created.id, 'lifetime', 'إضافة يدوية');
    } else {
      AuthService.grantUserPermission(created.id, parseInt(newPermission), 'إضافة يدوية');
    }

    // Sync to Cloud
    FirebaseService.syncUserToCloud(created).catch(() => {});

    setNotice({ text: `تمت إضافة المستخدم ${newEmail} وتفعيل الصلاحية بنجاح`, type: 'success' });
    setNewEmail('');
    setNewName('');
    setShowAddUser(false);
    onRefreshData();
  };

  const firebaseConfigSnippet = `// مسار الملف: /src/services/firebase.ts
export const firebaseConfig = {
  apiKey: "${firebaseConfig.apiKey}",
  authDomain: "${firebaseConfig.authDomain}",
  databaseURL: "${firebaseConfig.databaseURL}",
  projectId: "${firebaseConfig.projectId}",
  storageBucket: "${firebaseConfig.storageBucket}",
  messagingSenderId: "${firebaseConfig.messagingSenderId}",
  appId: "${firebaseConfig.appId}",
  measurementId: "${firebaseConfig.measurementId}"
};`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div 
        id="admin-management-panel"
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Panel Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">
                  {isArabic ? 'لوحة تحكم مدير ومصمم التطبيق' : 'App Designer & Owner Panel'}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase">
                  {OWNER_PHONE}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isArabic 
                  ? 'منح الصلاحيات، تفعيل الاشتراكات (100 ج.م)، ومزامنة السحابة Firebase' 
                  : 'Manage user permissions, monthly subscriptions (100 EGP), and cloud sync'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!sessionAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-5 grow">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-xs">
              <KeyRound className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h3 className="text-xl font-black text-slate-900">
                {isArabic ? 'لوحة التحكم محمية بكلمة مرور' : 'Admin Panel Password Protected'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isArabic 
                  ? 'أدخل كلمة المرور السرية الخاصة بمصمم ومدير التطبيق للوصول إلى أدوات تفعيل المشتركين والصلاحيات:' 
                  : 'Enter owner password to access user activation tools and license generator:'}
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="w-full max-w-sm space-y-3 pt-2">
              <div>
                <input
                  type="password"
                  autoFocus
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-center font-mono text-base tracking-widest focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-hidden bg-slate-50 focus:bg-white"
                />
              </div>

              {passwordError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isArabic ? 'تأكيد كلمة المرور والدخول' : 'Verify Password & Enter'}</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-3 overflow-x-auto">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'users'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{isArabic ? `المشتركون المسجلون (${allUsers.length})` : `Users (${allUsers.length})`}</span>
              </button>

              <button
                onClick={() => setActiveTab('licenses')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'licenses'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>{isArabic ? `أكواد التفعيل (${allLicenses.length})` : `License Keys (${allLicenses.length})`}</span>
              </button>

              <button
                onClick={() => setActiveTab('firebase')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'firebase'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Database className="w-4 h-4 text-emerald-600" />
                <span>{isArabic ? 'الربط بالفيربيس (Firebase)' : 'Firebase Cloud Sync'}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  isCloudConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isCloudConnected ? (isArabic ? 'متصل بنجاح 🟢' : 'Connected 🟢') : (isArabic ? 'محلي 🟡' : 'Local 🟡')}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'guide'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isArabic ? 'دليل استلام الـ 100 ج.م' : 'Activation Guide'}</span>
              </button>
            </div>

            {/* Global Alert Notification */}
            {notice && (
              <div className={`p-3 mx-5 mt-4 rounded-xl text-xs flex items-center justify-between ${
                notice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {notice.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{notice.text}</span>
                </div>
                <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Tab 1: Users & Permissions */}
            {activeTab === 'users' && (
              <div className="p-5 overflow-y-auto space-y-4 grow">
                
                {/* 🔒 1. Global App Lock (Kill Switch) Control Card */}
                <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                  isAppLockedGlobally 
                    ? 'bg-rose-950/20 border-rose-500/80 shadow-md shadow-rose-950/10' 
                    : 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-slate-700/80 shadow-sm'
                }`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isAppLockedGlobally ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                        <span className="text-xs font-black tracking-wide uppercase">
                          {isArabic ? 'قفل التطبيق العام (Kill Switch)' : 'Global App Lock'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAppLockedGlobally 
                            ? 'bg-rose-600 text-white animate-pulse' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        }`}>
                          {isAppLockedGlobally 
                            ? (isArabic ? '🔴 التطبيق مغلق كلياً الآن' : '🔴 App Locked Globally') 
                            : (isArabic ? '🟢 التطبيق متاح ويعمل للجميع' : '🟢 App Open for All')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {isArabic 
                          ? 'تنفيذ لحظي: عند قفل التطبيق يغلق فوراً على شاشة كل المستخدمين بدون ريفريش، وعند إلغاء القفل يفتح فوراً.'
                          : 'Instant action: Locks or unlocks app instantly on all users screens with zero refresh.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleToggleGlobalLock}
                        disabled={isTogglingLock}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-md ${
                          isAppLockedGlobally
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                        }`}
                      >
                        {isTogglingLock ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isAppLockedGlobally ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Ban className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isAppLockedGlobally 
                            ? (isArabic ? 'إلغاء القفل وفتح التطبيق للجميع 🟢' : 'Unlock App for All') 
                            : (isArabic ? 'قفل التطبيق بالكامل الآن 🔒' : 'Lock Entire App Now')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Reason Customizer */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <span className="text-[11px] font-semibold text-slate-300 shrink-0">
                      {isArabic ? 'سبب القفل الظاهر للمستخدمين:' : 'Lock Reason:'}
                    </span>
                    <input
                      type="text"
                      value={lockReasonInput}
                      onChange={(e) => setLockReasonInput(e.target.value)}
                      placeholder={isArabic ? 'اكتب سبب القفل أو الصيانة...' : 'Lock reason...'}
                      className="grow px-3 py-1.5 rounded-lg bg-black/30 border border-white/20 text-xs text-white placeholder-slate-400 focus:border-indigo-400 outline-hidden"
                    />
                    <button
                      onClick={async () => {
                        await FirebaseService.setGlobalAppLock(isAppLockedGlobally, lockReasonInput, currentUser?.email || 'admin');
                        setNotice({ text: 'تم تحديث سبب الإغلاق لحظياً للجميع', type: 'success' });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition cursor-pointer shrink-0"
                    >
                      {isArabic ? 'حفظ السبب' : 'Save Reason'}
                    </button>
                  </div>
                </div>

                {/* ⚡ 2. Instant Realtime Synchronization Notification Banner */}
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span className="font-bold">
                      {isArabic ? 'المزامنة السحابية اللحظية الفورية (WebSocket RTDB) نشطة ⚡' : 'Real-time WebSocket Sync Active ⚡'}
                    </span>
                    <span className="text-indigo-700 hidden sm:inline">
                      {isArabic ? '— الأوامر تطبق لحظياً عند المشترك بدون ريفريش نهائياً' : '— Instant update with 0 refresh'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold shrink-0 self-start sm:self-auto">
                    {isArabic ? 'فوري 0ms' : '0ms Push'}
                  </span>
                </div>

                {/* Action Bar: Search & Add User */}
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                  <div className="relative grow max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isArabic ? 'ابحث بالبريد الإلكتروني أو الاسم...' : 'Search by email or name...'}
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-hidden"
                    />
                  </div>

                  <button
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isArabic ? 'إضافة وتفعيل مشترك جديد' : 'Add & Activate User'}</span>
                  </button>
                </div>

                {/* Add User Form Drawer */}
                {showAddUser && (
                  <form onSubmit={handleAddManualUser} className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-900">
                      {isArabic ? 'إضافة وتفعيل مشترك مباشرة قبل أو بعد تواصله:' : 'Add and Activate User Directly:'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">البريد الإلكتروني:</label>
                        <input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="client@gmail.com"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">اسم المشترك:</label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="الاسم"
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">البرمشن / الصلاحية:</label>
                        <select
                          value={newPermission}
                          onChange={(e) => setNewPermission(e.target.value as any)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold"
                        >
                          <option value="30">شهر كامل (100 جنيه)</option>
                          <option value="90">3 أشهر (300 جنيه)</option>
                          <option value="365">سنة كاملة (12 شهر)</option>
                          <option value="lifetime">وصول دائم (مدى الحياة)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddUser(false)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 cursor-pointer"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        حفظ وتفعيل فوراً
                      </button>
                    </div>
                  </form>
                )}

                {/* Users List */}
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      {isArabic ? 'لم يتم العثور على أي مستخدمين مسجلين بعد' : 'No users found'}
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const sub = user.subscription;
                      const isOwner = user.email.toLowerCase() === OWNER_EMAIL.toLowerCase();

                      return (
                        <div 
                          key={user.id} 
                          className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          {/* User Info */}
                          <div className="flex items-center gap-3">
                            <img 
                              src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} 
                              alt={user.name} 
                              className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">
                                  {isOwner ? (isArabic ? 'مدير ومصمم التطبيق' : 'App Designer & Owner') : user.name}
                                </span>
                                {isOwner && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                                    {isArabic ? 'المصمم والمدير' : 'Owner'}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sub.status === 'lifetime' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : sub.status === 'active' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : sub.status === 'trial' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {sub.status === 'lifetime' 
                                    ? 'مدى الحياة' 
                                    : sub.status === 'active' 
                                    ? 'مشترك نشط' 
                                    : sub.status === 'trial' 
                                    ? `تجربة (${Math.floor(sub.trialSecondsRemaining / 60)}د)` 
                                    : 'منتهي الصلاحية'}
                                </span>
                              </div>
                              
                              <p className="text-xs text-slate-500 font-mono">
                                {isOwner ? (isArabic ? 'البريد الإلكتروني محمي ومخفي' : 'Email protected & hidden') : user.email}
                              </p>
                              
                              {sub.expiresAt && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  ينتهي في: {new Date(sub.expiresAt).toLocaleDateString('ar-EG')}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Permissions Action Buttons */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            
                            {/* Grant 1 Month (100 EGP) */}
                            <button
                              onClick={() => handleGrantPermission(user, 30)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition cursor-pointer"
                              title="تفعيل شهر كامل مقابل 100 جنيه"
                            >
                              شهر (100 ج.م)
                            </button>

                            {/* Grant Lifetime Access */}
                            <button
                              onClick={() => handleGrantPermission(user, 'lifetime')}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition cursor-pointer"
                              title="إتاحة وصول دائم مدى الحياة"
                            >
                              مدى الحياة
                            </button>

                            {/* Custom Days Input Toggle */}
                            {customDaysTargetId === user.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={customDaysValue}
                                  onChange={(e) => setCustomDaysValue(e.target.value)}
                                  className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-xs"
                                  placeholder="أيام"
                                />
                                <button
                                  onClick={() => {
                                    handleGrantPermission(user, parseInt(customDaysValue) || 30);
                                    setCustomDaysTargetId(null);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  تطبيق
                                </button>
                                <button
                                  onClick={() => setCustomDaysTargetId(null)}
                                  className="px-1.5 py-1 text-slate-400 text-xs cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setCustomDaysTargetId(user.id);
                                  setCustomDaysValue('60');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition cursor-pointer"
                              >
                                تحديد أيام...
                              </button>
                            )}

                            {/* Reset Trial (5 mins) */}
                            <button
                              onClick={() => handleResetTrial(user)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                              title="إعادة 5 دقائق تجربة مجانية"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            {/* Revoke / Expire */}
                            {!isOwner && (
                              <button
                                onClick={() => handleRevoke(user)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                                title="إيقاف الصلاحية وقفل التطبيق عليه"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: License Keys Generator */}
            {activeTab === 'licenses' && (
              <div className="p-5 overflow-y-auto space-y-5 grow">
                
                {/* Key Generator Card */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-black text-indigo-950">
                      {isArabic ? 'توليد كود تفعيل فوري لإرساله للمشترك عبر الواتساب:' : 'Generate Instant License Key:'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">نوع الكود:</label>
                      <select
                        value={newLicensePlan}
                        onChange={(e) => setNewLicensePlan(e.target.value as any)}
                        className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                      >
                        <option value="monthly">شهر كامل (100 جنيه مصري)</option>
                        <option value="custom">فترة مخصصة بالأيام</option>
                        <option value="lifetime">وصول دائم غير محدود (مدى الحياة)</option>
                      </select>
                    </div>

                    {newLicensePlan === 'custom' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">عدد الأيام:</label>
                        <input
                          type="number"
                          value={newLicenseDays}
                          onChange={(e) => setNewLicenseDays(e.target.value)}
                          placeholder="30"
                          className="w-24 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>
                    )}

                    <div className="self-end">
                      <button
                        onClick={handleCreateLicense}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>{isArabic ? 'توليد الكود الآن' : 'Generate Key'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* List of Keys */}
                <div className="space-y-3">
                  {/* Optional Phone Number to send directly to subscriber's chat */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">إرسال كود مباشر لرقم هاتف المشترك:</span>
                      <span className="text-[11px] text-slate-500">اكتب رقم هاتف العميل ليتم فتح محادثته الشخصية مباشرة مجهزة بالكود:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="tel"
                        value={targetPhone}
                        onChange={(e) => setTargetPhone(e.target.value)}
                        placeholder="مثال: 01012345678"
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 w-44"
                      />
                      {targetPhone && (
                        <button
                          onClick={() => setTargetPhone('')}
                          className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          مسح
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-700">
                    {isArabic ? 'الأكواد المولدة المتاحة والمستخدمة:' : 'Generated License Keys:'}
                  </h4>

                  {allLicenses.map((key) => {
                    const cleanPhone = targetPhone.replace(/\D/g, '');
                    const formattedPhone = cleanPhone.startsWith('01') 
                      ? `2${cleanPhone}` 
                      : cleanPhone.startsWith('20') 
                      ? cleanPhone 
                      : cleanPhone;

                    const whatsappMsg = `السلام عليكم ورحمة الله،
أهلاً بك في تطبيق LinguaReader Pro لتعلم اللغات بالقراءة والذكاء الاصطناعي.

كود تفعيل اشتراكك الخاص هو:
*${key.code}*

صلاحية الكود: ${key.plan === 'lifetime' ? 'وصول دائم غير محدود مدى الحياة' : (key.durationDays || 30) + ' يوماً (اشتراك شهري 100 جنيه)'}.

طريقة التفعيل:
1. افتح التطبيق في متصفحك أو هاتفك.
2. في الشاشة التي تظهر لك، الصق الكود في خانة "كود التفعيل".
3. اضغط على زر "تفعيل الحساب" ومبروك عليك!

مع تحيات مصمم ومدير التطبيق (م. محمد - ${OWNER_PHONE}).`;

                    const directSendUrl = formattedPhone 
                      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMsg)}`
                      : `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;

                    return (
                      <div 
                        key={key.code}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-indigo-300 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm tracking-wider text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {key.code}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              key.isUsed ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {key.isUsed ? `مستخدم بواسطة ${key.usedByEmail || 'مستخدم'}` : 'جاهز للاستخدام'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {key.plan === 'lifetime' ? 'وصول دائم مدى الحياة' : `اشتراك لمدة ${key.durationDays || 30} يوماً (100 جنيه)`}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(key.code)}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            title="نسخ الكود فقط للحافظة"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedCode === key.code ? 'تم النسخ!' : 'نسخ الكود'}</span>
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(whatsappMsg);
                              setNotice({ text: 'تم نسخ رسالة الواتساب الكاملة مع الكود بنجاح! يمكنك لصقها الآن في محادثة العميل.', type: 'success' });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                            title="نسخ رسالة الواتساب الجاهزة بالكامل"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>نسخ الرسالة</span>
                          </button>

                          <a
                            href={directSendUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{targetPhone ? `إرسال للرقم (${targetPhone})` : 'إرسال بالواتساب'}</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Firebase Cloud Sync Info & Code Configuration */}
            {activeTab === 'firebase' && (
              <div className="p-5 overflow-y-auto space-y-5 grow text-slate-800 text-xs">
                
                {/* Status Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-900">حالة الربط بالسحابة (Firebase)</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                          مشروع: {firebaseConfig.projectId}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        تم تفعيل المزامنة المباشرة لقاعدة البيانات (Firestore + Realtime Database) وحسابات Google الحقيقية.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Where to find and put the code */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <FileCode2 className="w-4 h-4 text-indigo-600" />
                      <span>مكان كود الربط بالفيربيس في المشروع:</span>
                    </div>
                    <span className="text-[11px] text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-1 rounded-md">
                      /src/services/firebase.ts
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    تم وضع كود الربط الخاص بك في الملف الموضح أعلاه. إذا أردت نسخه أو نقله في أي وقت، إليك الكود الكامل المدمج في تطبيقك:
                  </p>

                  <div className="relative">
                    <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                      {firebaseConfigSnippet}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(firebaseConfigSnippet);
                        setCopiedFirebaseSnippet(true);
                        setTimeout(() => setCopiedFirebaseSnippet(false), 2000);
                      }}
                      className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedFirebaseSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedFirebaseSnippet ? 'تم النسخ' : 'نسخ الكود'}</span>
                    </button>
                  </div>
                </div>

                {/* Live users preview in cloud */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">المستخدمون المتصلون سحابياً:</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      مزامنة لحظية مباشرة
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    كل مستخدم يسجل دخوله بحساب Google يظهر هنا تلقائياً في قائمة المشتركين ويمكنك تفعيله بضغطة زر واحدة (شهر 100 جنيه أو مدى الحياة)، وسيتفعل تطبيقه فوراً دون أي تدخل منه!
                  </p>
                </div>
              </div>
            )}

            {/* Tab 4: Detailed Step-by-Step Guide for Admin */}
            {activeTab === 'guide' && (
              <div className="p-6 overflow-y-auto space-y-6 grow text-slate-800 text-xs">
                
                {/* Intro banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-50 to-emerald-50 border border-amber-300/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      دليل مدير ومصمم التطبيق: كيف تستلم الـ 100 جنيه وتفعل الحساب للعميل؟
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    عندما تنتهي الـ 5 دقائق المجانية عند أي مستخدم، يظهر له زر أخضر كبير يفتتح محادثة واتساب معك على رقمك 
                    <strong className="text-slate-900 mx-1">01120194940</strong> 
                    ويرسل لك رسالة جاهزة فيها إيميله ومكتوب فيها (الاشتراك الشهري 100 جنيه). 
                    أمامك خياران في غاية السهولة للتفعيل:
                  </p>
                </div>

                {/* Method 1 */}
                <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                        1
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                        الطريقة الأولى (الأسرع والأسهل على الإطلاق - بدون أكواد):
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                      موصى بها
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px] text-emerald-900 leading-relaxed pr-2">
                    <p>1. العميل يرسل لك رسالة على الواتساب فيها إيميله (مثل: <code className="bg-white px-1 py-0.5 rounded border border-emerald-300 font-bold">ahmed@gmail.com</code>) ويحول لك الـ 100 جنيه (فودافون كاش أو إنستاباي).</p>
                    <p>2. افتح التطبيق بحسابك، واضغط من الشريط العلوي على <strong>«لوحة التحكم والصلاحيات»</strong>.</p>
                    <p>3. في تبويب <strong>«المشتركون المسجلون»</strong>، ابحث عن إيميله، واضغط على الزر الأخضر: <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">شهر (100 ج.م)</span> أو <span className="bg-purple-600 text-white px-2 py-0.5 rounded font-bold">مدى الحياة</span>.</p>
                    <p className="font-bold text-emerald-800">✅ بمجرد الضغط، يتفعل حسابه فوراً دون أن يحتاج هو لإدخال أي كود!</p>
                  </div>
                </div>

                {/* Method 2 */}
                <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-indigo-950">
                      الطريقة الثانية (إرسال كود تفعيل للمشترك عبر الواتساب):
                    </h4>
                  </div>

                  <div className="space-y-2 text-[11px] text-indigo-900 leading-relaxed pr-2">
                    <p>1. افتح تبويب <strong>«أكواد التفعيل»</strong> في هذه اللوحة.</p>
                    <p>2. اضغط على زر <strong>«توليد الكود الآن»</strong> (سيقوم النظام بعمل كود مثل <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-300 font-mono font-bold">READ-30D-XXXX</code>).</p>
                    <p>3. اضغط على زر <strong>«إرسال بالواتساب»</strong> أو <strong>«نسخ الرسالة»</strong> وابعته للعميل في شات الواتساب.</p>
                    <p>4. العميل يضع الكود في خانة كود التفعيل في شاشة القفل ويضغط <strong>«تفعيل الحساب»</strong>، فيفتح التطبيق له فوراً لمدة شهر كامل.</p>
                  </div>
                </div>

                {/* Secret Master Code */}
                <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-amber-950">
                      كلمة مرور المدير وكود الماستر السحري (خاص بك):
                    </h4>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    كلمة المرور السرية <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">4704600vdlhs@</strong> أو رقم هاتفك <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">01120194940</strong> أو الكود <strong className="text-slate-900 bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono">VIP2026</strong> يفتحون التطبيق ويمنحون وصولاً مفتوحاً دائماً بنقرة واحدة!
                  </p>
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
