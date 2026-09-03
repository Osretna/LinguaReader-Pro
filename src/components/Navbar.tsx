import React from 'react';
import { UserProfile } from '../types';
import { logOut } from '../firebase';
import { 
  BookOpen, 
  Bookmark, 
  BarChart3, 
  Shield, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  Clock,
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  activeTab: 'reader' | 'vocab' | 'stats' | 'admin';
  setActiveTab: (tab: 'reader' | 'vocab' | 'stats' | 'admin') => void;
  savedWordsCount: number;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  savedWordsCount,
  onOpenAuthModal
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setActiveTab('reader')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">LinguaReader</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30 font-bold">PRO</span>
              </div>
              <p className="text-[10px] text-slate-400">قارئ اللغات الذكي</p>
            </div>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        {currentUser && currentUser.isActivated && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('reader')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reader'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>القارئ التفاعلي</span>
            </button>

            <button
              onClick={() => setActiveTab('vocab')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'vocab'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>المفردات والبطاقات</span>
              {savedWordsCount > 0 && (
                <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 rounded-full font-bold">
                  {savedWordsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>الإحصائيات والتقدم</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>لوحة المشرف</span>
              </button>
            )}
          </nav>
        )}

        {/* User Account Controls / Sign in */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* Profile Pill */}
              <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/80 rounded-full py-1 px-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-600 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-medium text-white truncate max-w-[120px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    {isAdmin ? (
                      <span className="text-purple-400 font-semibold">مشرف النظام</span>
                    ) : currentUser.isActivated ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        مفعل
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        بانتظار التفعيل
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={() => logOut()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-indigo-600/30"
            >
              تسجيل الدخول / ربط الحساب
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {currentUser && currentUser.isActivated && (
        <div className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 p-2">
          <button
            onClick={() => setActiveTab('reader')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition ${
              activeTab === 'reader' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>القارئ</span>
          </button>
          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition ${
              activeTab === 'vocab' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>المفردات ({savedWordsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition ${
              activeTab === 'stats' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-medium transition ${
                activeTab === 'admin' ? 'text-purple-400' : 'text-slate-400'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>المشرف</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
