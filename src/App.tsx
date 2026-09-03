import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Library } from './components/Library';
import { InteractiveReader } from './components/InteractiveReader';
import { VocabularySRS } from './components/VocabularySRS';
import { Dashboard } from './components/Dashboard';
import { SettingsModal } from './components/SettingsModal';
import { TWAGuideModal } from './components/TWAGuideModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { VoiceLevelTest } from './components/VoiceLevelTest';
import { ReadingMasteryGuideModal } from './components/ReadingMasteryGuideModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { SubscriptionLockModal } from './components/SubscriptionLockModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { TrialBanner } from './components/TrialBanner';
import { ContentItem, ReaderSettings, UserStats, CEFRLevel, AuthUser } from './types';
import { StorageService, DEFAULT_SETTINGS, DEFAULT_STATS } from './services/storage';
import { AuthService, OWNER_EMAIL } from './services/auth';
import { INITIAL_CONTENT_ITEMS } from './data/mockContent';

export default function App() {
  const [activeTab, setActiveTab] = useState<'library' | 'reader' | 'vocabulary' | 'dashboard' | 'voice-test'>('library');
  const [selectedContent, setSelectedContent] = useState<ContentItem>(INITIAL_CONTENT_ITEMS[0]);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);

  // Authentication & Subscription State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => AuthService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Other Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTWAGuideOpen, setIsTWAGuideOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Language direction: if nativeLanguage is 'ar', dir="rtl"
  const isArabic = settings.nativeLanguage === 'ar';

  useEffect(() => {
    // Load persisted settings and user stats on start
    const loadedSettings = StorageService.getSettings();
    const loadedStats = StorageService.getUserStats();
    setSettings(loadedSettings);
    setStats(loadedStats);

    // If no user is logged in yet, check current user or prompt sign-in
    const active = AuthService.getCurrentUser();
    if (!active) {
      // Auto open Google sign-in modal if first visit so they can start their 5-min trial
      const hasSeenAuth = localStorage.getItem('lingua_seen_auth_prompt');
      if (!hasSeenAuth) {
        setIsAuthModalOpen(true);
        localStorage.setItem('lingua_seen_auth_prompt', 'true');
      }
    } else {
      setCurrentUser(active);
    }
  }, []);

  // 5-Minute Trial Timer Interval
  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.email.toLowerCase() === OWNER_EMAIL.toLowerCase()) return;
    if (currentUser && currentUser.subscription.status !== 'trial') return;

    const timer = setInterval(() => {
      // Tick persistent device trial
      const deviceSec = AuthService.tickDeviceTrial();

      // Tick logged-in user trial
      if (currentUser && currentUser.subscription.status === 'trial') {
        setCurrentUser((prev) => {
          if (!prev) return null;
          const updated = AuthService.tickTrial(prev);
          return { ...updated };
        });
      } else if (deviceSec <= 0) {
        AuthService.lockDevice();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser?.subscription.status, currentUser?.subscription.isExpired, currentUser?.role]);

  const handleUpdateSettings = (newPartial: Partial<ReaderSettings>) => {
    const updated = StorageService.saveSettings(newPartial);
    setSettings(updated);
  };

  const handleSelectContent = (item: ContentItem) => {
    setSelectedContent(item);
    setActiveTab('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [isForceUnlocked, setIsForceUnlocked] = useState(false);

  const refreshStats = () => {
    setStats(StorageService.getUserStats());
  };

  const refreshUser = () => {
    const fresh = AuthService.getCurrentUser();
    setCurrentUser(fresh ? { ...fresh } : null);
  };

  const handleUnlockSuccess = () => {
    AuthService.unlockDevice();
    setIsForceUnlocked(true);
    refreshUser();
    refreshStats();
  };

  const handleSignOut = () => {
    AuthService.signOut();
    setCurrentUser(null);
    setIsForceUnlocked(false);
  };

  // Check if current user is admin or has active paid/lifetime subscription
  const hasActiveAccess = Boolean(
    currentUser && (
      currentUser.role === 'admin' ||
      currentUser.email.toLowerCase() === OWNER_EMAIL.toLowerCase() ||
      currentUser.subscription.status === 'lifetime' ||
      (currentUser.subscription.status === 'active' && !currentUser.subscription.isExpired)
    )
  );

  const isDevicePermanentlyUnlocked = AuthService.isDeviceUnlocked();
  const isDeviceTrialLocked = !isDevicePermanentlyUnlocked && AuthService.isDeviceLocked();
  const isUserExpired = Boolean(
    currentUser && (currentUser.subscription.isExpired || currentUser.subscription.status === 'expired')
  );

  // The lock screen persists across refreshes and restarts, but disappears immediately when unlocked
  const isLocked = !isForceUnlocked && !hasActiveAccess && !isDevicePermanentlyUnlocked && (isDeviceTrialLocked || isUserExpired);

  return (
    <div 
      id="linguareader-pro-app" 
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Trial Countdown / Admin / Guest Status Banner */}
      <TrialBanner
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        isArabic={isArabic}
      />

      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          refreshStats();
        }}
        settings={settings}
        stats={stats}
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTWAGuide={() => setIsTWAGuideOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        isArabic={isArabic}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeTab === 'library' && (
          <Library
            onSelectContent={handleSelectContent}
            onStartVoiceTest={() => setActiveTab('voice-test')}
            onOpenGuide={() => setIsGuideOpen(true)}
            isArabic={isArabic}
          />
        )}

        {activeTab === 'voice-test' && (
          <VoiceLevelTest
            onCompleteLevel={(level: CEFRLevel) => {
              refreshStats();
            }}
            onGoToLibrary={(filterLevel) => {
              setActiveTab('library');
              refreshStats();
            }}
            onOpenGuide={() => setIsGuideOpen(true)}
            isArabic={isArabic}
          />
        )}

        {activeTab === 'reader' && (
          <InteractiveReader
            item={selectedContent}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onBackToLibrary={() => {
              setActiveTab('library');
              refreshStats();
            }}
            isArabic={isArabic}
          />
        )}

        {activeTab === 'vocabulary' && (
          <VocabularySRS isArabic={isArabic} />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            onStartVoiceTest={() => setActiveTab('voice-test')}
            onOpenGuide={() => setIsGuideOpen(true)}
            isArabic={isArabic} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">LinguaReader Pro</span>
            <span>—</span>
            <span>{isArabic ? 'منصة تعليم اللغات بالقراءة الذكية والتكرار المتباعد' : 'Smart Reading & SRS Spaced Repetition Platform'}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="text-amber-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>لوحة تحكم المدير</span>
              </button>
            )}
            <button 
              onClick={() => setIsTWAGuideOpen(true)}
              className="text-indigo-600 hover:underline cursor-pointer"
            >
              {isArabic ? 'تصدير APK / TWA' : 'Export APK / TWA'}
            </button>
            <a 
              href="/ads.txt" 
              target="_blank" 
              rel="noreferrer"
              className="hover:underline text-slate-400"
            >
              ads.txt (AdSense)
            </a>
            <span>v1.0.0 PWA</span>
          </div>
        </div>
      </footer>

      {/* Google Sign-in Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          refreshStats();
        }}
        isArabic={isArabic}
      />

      {/* Subscription / 5-Minute Trial Lock Modal (Barrier) */}
      {isLocked && (
        <SubscriptionLockModal
          user={currentUser}
          onRefreshUser={refreshUser}
          onUnlock={handleUnlockSuccess}
          onSignOut={handleSignOut}
          isArabic={isArabic}
        />
      )}

      {/* Admin Panel Modal for Owner */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        onRefreshData={() => {
          refreshUser();
          refreshStats();
        }}
        isArabic={isArabic}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        isArabic={isArabic}
      />

      {/* TWA Android Guide Modal */}
      <TWAGuideModal
        isOpen={isTWAGuideOpen}
        onClose={() => setIsTWAGuideOpen(false)}
        isArabic={isArabic}
      />

      {/* Reading Mastery Scientific Guide Modal */}
      <ReadingMasteryGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onStartVoiceTest={() => {
          setIsGuideOpen(false);
          setActiveTab('voice-test');
        }}
        onGoToLibrary={() => {
          setIsGuideOpen(false);
          setActiveTab('library');
        }}
        onGoToSRS={() => {
          setIsGuideOpen(false);
          setActiveTab('vocabulary');
        }}
        isArabic={isArabic}
      />

      {/* Network Connectivity / Offline Indicator */}
      <OfflineIndicator isArabic={isArabic} />
    </div>
  );
}

