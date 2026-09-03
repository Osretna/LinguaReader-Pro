import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  getAllRegisteredUsers, 
  setUserActivationStatus, 
  setUserRole 
} from '../firebase';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Send, 
  Sparkles,
  Mail,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminPanelProps {
  currentUser: UserProfile;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'admin'>('all');
  const [quickInput, setQuickInput] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const all = await getAllRegisteredUsers();
      // تأكد من وجود المستخدم الحالي أيضاً في القائمة
      if (all.length === 0) {
        setUsers([currentUser]);
      } else {
        // ترتيب المستخدمين: المعلقون أولاً ثم الأحدث تسجيلاً
        all.sort((a, b) => {
          if (!a.isActivated && b.isActivated) return -1;
          if (a.isActivated && !b.isActivated) return 1;
          return new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime();
        });
        setUsers(all);
      }
    } catch (err) {
      console.error("Error loading users in admin panel:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActivation = async (targetUser: UserProfile) => {
    const nextState = !targetUser.isActivated;
    try {
      await setUserActivationStatus(targetUser.uid, nextState, currentUser.email || 'Admin');
      
      // تحديث الحالة محلياً فوراً
      setUsers(prev => prev.map(u => u.uid === targetUser.uid ? {
        ...u,
        isActivated: nextState,
        activationDate: nextState ? new Date().toISOString() : undefined,
        activatedBy: currentUser.email || 'Admin'
      } : u));

      if (nextState) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
        setActionSuccess(`تم تفعيل حساب ${targetUser.displayName || targetUser.email} بنجاح!`);
      } else {
        setActionSuccess(`تم إيقاف تفعيل حساب ${targetUser.displayName || targetUser.email}`);
      }

      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error("Toggle activation error:", err);
      alert('حدث خطأ أثناء تحديث حالة التفعيل.');
    }
  };

  const handleQuickActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const query = quickInput.trim().toLowerCase();
    const found = users.find(u => 
      (u.email && u.email.toLowerCase() === query) || 
      u.uid === query
    );

    if (found) {
      await handleToggleActivation(found);
      setQuickInput('');
    } else {
      alert(`لم يتم العثور على مستخدم بالبريد أو المعرف: ${quickInput}`);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.uid.includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterStatus === 'pending') return !user.isActivated && user.role !== 'admin';
    if (filterStatus === 'active') return user.isActivated;
    if (filterStatus === 'admin') return user.role === 'admin';
    return true;
  });

  const totalUsers = users.length;
  const pendingCount = users.filter(u => !u.isActivated && u.role !== 'admin').length;
  const activeCount = users.filter(u => u.isActivated).length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>لوحة تحكم المشرف وإدارة التفعيل</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                مباشر (Firebase)
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة صلاحيات المستخدمين وتفعيل الاشتراكات لمشروع <span className="text-slate-200 font-mono">linguareader-pro</span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>إجمالي المسجلين</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalUsers}</div>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 shadow-sm bg-amber-500/5">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-2 font-medium">
            <span>بانتظار التفعيل</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{pendingCount}</div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4 shadow-sm bg-emerald-500/5">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2 font-medium">
            <span>المفعلين والنشطين</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">{activeCount}</div>
        </div>

        <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-4 shadow-sm bg-purple-500/5">
          <div className="flex items-center justify-between text-purple-400 text-xs mb-2 font-medium">
            <span>المشرفين</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300">{adminCount}</div>
        </div>
      </div>

      {/* Direct Quick Activate Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <form onSubmit={handleQuickActivate} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="اكتب البريد الإلكتروني أو المعرف لتفعيله سريعاً..."
              className="w-full pr-10 pl-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>تفعيل فوري</span>
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
            className="w-full pr-10 pl-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              filterStatus === 'all' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            الكل ({users.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              filterStatus === 'pending' 
                ? 'bg-amber-600 text-white' 
                : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
            }`}
          >
            بانتظار التفعيل ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              filterStatus === 'active' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            المفعلين ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              filterStatus === 'admin' 
                ? 'bg-purple-600 text-white' 
                : 'bg-slate-800 text-purple-400 hover:bg-slate-700'
            }`}
          >
            المشرفين ({adminCount})
          </button>
        </div>
      </div>

      {/* Users List Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">جارٍ تحميل بيانات المستخدمين من Firebase...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">لا يوجد مستخدمين مطابقين للبحث</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredUsers.map((user) => {
              const isAdmin = user.role === 'admin';
              const isPending = !user.isActivated && !isAdmin;

              return (
                <div 
                  key={user.uid}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-slate-800/40 ${
                    isPending ? 'bg-amber-500/5' : ''
                  }`}
                >
                  {/* User info */}
                  <div className="flex items-center gap-3.5">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-12 h-12 rounded-full border border-slate-700 object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-indigo-400 flex-shrink-0">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">
                          {user.displayName || 'مستخدم بدون اسم'}
                        </span>
                        {isAdmin && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40 font-medium">
                            مشرف النظام
                          </span>
                        )}
                        {user.isActivated ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            مفعل
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            بانتظار التفعيل
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 font-mono mt-0.5 truncate dir-ltr text-right">
                        {user.email}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>سجل في: {new Date(user.createdAt).toLocaleDateString('ar-EG')}</span>
                        <span>•</span>
                        <span>آخر دخول: {new Date(user.lastLoginAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 sm:self-center">
                    {!isAdmin ? (
                      <button
                        onClick={() => handleToggleActivation(user)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          user.isActivated
                            ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        }`}
                      >
                        {user.isActivated ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>إلغاء التفعيل</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>تفعيل الحساب الآن</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-purple-400 font-medium px-3 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        مشرف دائم
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
