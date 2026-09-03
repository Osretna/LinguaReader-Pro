import React, { useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  BookOpen, 
  BrainCircuit, 
  BarChart3, 
  Flame, 
  Settings, 
  Smartphone, 
  Mic, 
  Sparkles, 
  Award,
  Crown,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { ReaderSettings, UserStats, AuthUser } from '../types';

interface HeaderProps {
  activeTab: 'library' | 'reader' | 'vocabulary' | 'dashboard' | 'voice-test';
  setActiveTab: (tab: 'library' | 'reader' | 'vocabulary' | 'dashboard' | 'voice-test') => void;
  settings: ReaderSettings;
  stats: UserStats;
  user: AuthUser | null;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onOpenTWAGuide: () => void;
  onOpenGuide: () => void;
  isArabic: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  stats,
  user,
  onOpenAuth,
  onOpenAdmin,
  onSignOut,
  onOpenSettings,
  onOpenTWAGuide,
  onOpenGuide,
  isArabic,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  return (
    <header 
      id="main-app-header" 
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button 
              id="brand-logo-btn"
              onClick={() => setActiveTab('library')} 
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition duration-150">
                <div className="w-full h-full bg-slate-900/10 rounded-[10px] flex items-center justify-center">
                  <img src="/icon.svg" alt="LinguaReader Pro" className="w-7 h-7 object-contain" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
                    LinguaReader
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    Pro
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isArabic ? 'القراءة الذكية للغات' : 'Smart Language Reader'}
                </span>
              </div>
            </button>

            {/* Desktop Navigation Tabs */}
            <nav id="desktop-nav-tabs" className="hidden md:flex items-center gap-1 mr-4 ml-4">
              <button
                id="nav-library-btn"
                onClick={() => setActiveTab('library')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'library' || activeTab === 'reader'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{isArabic ? 'المكتبة' : 'Library'}</span>
              </button>

              <button
                id="nav-voice-test-btn"
                onClick={() => setActiveTab('voice-test')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer relative ${
                  activeTab === 'voice-test'
                    ? 'bg-rose-50 text-rose-700'
                    : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/50'
                }`}
              >
                <Mic className="w-4 h-4 text-rose-500" />
                <span>{isArabic ? 'اختبار المستوى الصوتي' : 'Voice Test'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase">
                  {stats.assessedLevel || (isArabic ? 'صوتي' : 'AI')}
                </span>
              </button>

              <button
                id="nav-vocabulary-btn"
                onClick={() => setActiveTab('vocabulary')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer relative ${
                  activeTab === 'vocabulary'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                <span>{isArabic ? 'قاموسي (SRS)' : 'Vocabulary (SRS)'}</span>
                {stats.totalWordsLearned > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                    {stats.totalWordsLearned}
                  </span>
                )}
              </button>

              <button
                id="nav-dashboard-btn"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{isArabic ? 'الإحصائيات' : 'Dashboard'}</span>
              </button>
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Guide Button - How to learn language through reading */}
            <button
              id="reading-guide-header-btn"
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title={isArabic ? 'دليل أسرار التعلم السريع بالقراءة' : 'Fast Language Learning Guide'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isArabic ? 'دليل التعلم السريع' : 'Learning Guide'}</span>
            </button>

            {/* Streak Counter */}
            <div 
              id="streak-indicator"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold"
              title={isArabic ? `${stats.streakDays} أيام قراءة متتالية!` : `${stats.streakDays} day reading streak!`}
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{stats.streakDays} {isArabic ? 'أيام' : 'days'}</span>
            </div>

            {/* User Profile / Google Sign-In Button */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-header-btn"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer border border-slate-200"
                >
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email || user.id}`}
                    alt={user.name || 'User'}
                    className="w-6 h-6 rounded-full bg-indigo-100"
                  />
                  <span className="hidden sm:inline truncate max-w-[90px]">{(user.name || user.email || 'User').split(' ')[0]}</span>
                  {user.role === 'admin' ? (
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                  ) : user.subscription?.status === 'lifetime' ? (
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  ) : user.subscription?.status === 'active' ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div 
                    id="user-profile-dropdown"
                    className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 text-xs text-slate-700 animate-fadeIn"
                    dir={isArabic ? 'rtl' : 'ltr'}
                  >
                    <div className="pb-2 mb-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {user.role === 'admin' ? (isArabic ? 'مدير ومصمم التطبيق' : 'App Designer') : (user.name || 'مستخدم')}
                      </p>
                      <p className="text-slate-500 text-[11px] truncate">
                        {user.role === 'admin' ? (isArabic ? 'حساب الإدارة المعتمد' : 'Admin Account') : (user.email || '')}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">
                          {user.subscription?.planNameAr || user.subscription?.planNameEn || (isArabic ? 'مشترك' : 'Member')}
                        </span>
                        {user.role === 'admin' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-100 text-amber-800">
                            {isArabic ? 'مدير التطبيق' : 'Admin'}
                          </span>
                        )}
                      </div>
                    </div>

                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAdmin();
                        }}
                        className="w-full text-right py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-2 mb-1.5 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>لوحة إدارة المشتركين والأكواد</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onSignOut();
                      }}
                      className="w-full text-right py-2 px-2.5 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{isArabic ? 'تسجيل الخروج' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="header-google-signin-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isArabic ? 'دخول بجوجل' : 'Sign in'}</span>
              </button>
            )}

            {/* Android TWA APK Quick Guide */}
            <button
              id="twa-guide-trigger-btn"
              onClick={onOpenTWAGuide}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
              title={isArabic ? 'دليل تصدير تطبيق Android APK (TWA)' : 'Android APK (TWA) Guide'}
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span>{isArabic ? 'أندرويد' : 'APK'}</span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton isArabic={isArabic} />

            {/* Settings Button */}
            <button
              id="settings-trigger-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title={isArabic ? 'الإعدادات واللغات' : 'Settings & Preferences'}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div id="mobile-bottom-tabs" className="flex md:hidden border-t border-slate-100 py-1.5 justify-around">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[11px] font-semibold ${
              activeTab === 'library' || activeTab === 'reader' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isArabic ? 'المكتبة' : 'Library'}</span>
          </button>

          <button
            onClick={() => setActiveTab('voice-test')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[11px] font-semibold ${
              activeTab === 'voice-test' ? 'text-rose-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Mic className="w-4 h-4 text-rose-500" />
            <span>{isArabic ? 'اختبار صوتي' : 'Voice Test'}</span>
          </button>

          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[11px] font-semibold ${
              activeTab === 'vocabulary' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>{isArabic ? 'قاموسي' : 'SRS'}</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[11px] font-semibold ${
              activeTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isArabic ? 'تقدمي' : 'Stats'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
