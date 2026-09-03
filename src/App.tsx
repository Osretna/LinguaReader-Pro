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
import { LockoutScreen } from './components/LockoutScreen';
import { AdminPanelModal } from './components/AdminPanelModal';
import { TrialBanner } from './components/TrialBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ContentItem, ReaderSettings, UserStats, CEFRLevel, AuthUser } from './types';
import { LicenseConfig } from './types/license';
import { loadLicenseConfig, saveLicenseConfig, subscribeToLicense } from './utils/licenseManager';
import { StorageService, DEFAULT_SETTINGS, DEFAULT_STATS } from './services/storage';
import { AuthService, OWNER_EMAIL } from './services/auth';
import { FirebaseService } from './services/firebase';
import { INITIAL_CONTENT_ITEMS } from './data/mockContent';

export default function App() {
  const [activeTab, setActiveTab] = useState<'library' | 'reader' | 'vocabulary' | 'dashboard' | 'voice-test'>('library');
  const [selectedContent, setSelectedContent] = useState<ContentItem>(INITIAL_CONTENT_ITEMS[0]);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);

  // Authentication & Subscription State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => AuthService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => !AuthService.getCurrentUser());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isForceUnlocked, setIsForceUnlocked] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());

  // License configuration state for app duration and stop controls
  const [licenseConfig, setLicenseConfig] = useState<LicenseConfig>(() => loadLicenseConfig());

  useEffect(() => {
    const unsub = subscribeToLicense((newCfg) => {
      setLicenseConfig(newCfg);
    });
    return () => unsub();
  }, []);

  // Global App State (Kill Switch & Broadcast Notifications)
  const [globalAppState, setGlobalAppState] = useState<{ isAppLocked: boolean; lockReason?: string }>({ isAppLocked: false });
  const [liveNotice, setLiveNotice] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

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

    // If no user is logged in yet, show the Google sign-in modal with app visible in background
    const active = AuthService.getCurrentUser();
    if (!active) {
      setIsAuthModalOpen(true);
    } else {
      setCurrentUser(active);
      FirebaseService.syncUserToCloud(active).catch(() => {});
    }

    // Sync any Firebase Auth user on startup/return
    const unsubAuth = FirebaseService.onAuthChanged(async (fbUser) => {
      if (fbUser && fbUser.email) {
        const current = AuthService.getCurrentUser();
        if (!current || current.email.toLowerCase() !== fbUser.email.toLowerCase()) {
          const newUser = AuthService.signInWithGoogle({
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email.split('@')[0],
            picture: fbUser.photoURL || undefined,
            googleId: fbUser.uid,
          });
          setCurrentUser(newUser);
          setIsAuthModalOpen(false);
          await FirebaseService.syncUserToCloud(newUser);
        } else {
          FirebaseService.syncUserToCloud(current).catch(() => {});
        }
      }
    });

    return () => {
      unsubAuth?.();
    };
  }, []);

  // Global App Lock & Broadcast real-time listener
  useEffect(() => {
    const unsubGlobal = FirebaseService.listenToGlobalAppState((state) => {
      setGlobalAppState({
        isAppLocked: state.isAppLocked,
        lockReason: state.lockReason,
      });

      if (state.broadcastNotice) {
        setLiveNotice({
          message: state.broadcastNotice,
          type: 'warning',
        });
        setTimeout(() => setLiveNotice(null), 8000);
      }
    });

    return () => {
      unsubGlobal?.();
    };
  }, []);

  // Real-time Cloud Sync Listener for current user (Instant sub-100ms activation/lock)
  useEffect(() => {
    if (!currentUser?.id) return;
    
    // Listen for remote activation, trial renewal, or revoking by admin
    const unsub = FirebaseService.listenToMyUser(
      currentUser.id, 
      (updatedUser) => {
        if (updatedUser) {
          const prevStatus = currentUser.subscription.status;
          const newStatus = updatedUser.subscription.status;

          // If user was activated remotely by admin, update locally and unlock immediately without refresh
          if (
            newStatus === 'active' || 
            newStatus === 'lifetime' || 
            updatedUser.role === 'admin'
          ) {
            AuthService.unlockDevice();
            setIsForceUnlocked(true);
            AuthService.saveUser(updatedUser, false);
            setCurrentUser(updatedUser);

            if (prevStatus !== newStatus) {
              setLiveNotice({
                message: newStatus === 'lifetime' 
                  ? '🎉 تم تفعيل الوصول الدائم (مدى الحياة) لحسابك من الإدارة لحظياً!' 
                  : '🎉 تم تفعيل اشتراكك الشهري (100 ج.م) بنجاح من لوحة تحكم الإدارة لحظياً!',
                type: 'success',
              });
              setTimeout(() => setLiveNotice(null), 7000);
            }
          } else if (newStatus === 'expired') {
            // Admin revoked access or trial ended
            AuthService.lockDevice();
            setIsForceUnlocked(false);
            setCurrentUser(prev => prev ? { 
              ...prev, 
              subscription: { ...prev.subscription, status: 'expired', isExpired: true, trialSecondsRemaining: 0 } 
            } : null);

            setLiveNotice({
              message: '🔒 تم إيقاف الصلاحية وقفل التطبيق بواسطة الإدارة',
              type: 'error',
            });
            setTimeout(() => setLiveNotice(null), 7000);
          } else if (newStatus === 'trial') {
            // Admin renewed 5-minute trial remotely
            AuthService.unlockDevice();
            setIsForceUnlocked(false);
            AuthService.saveUser(updatedUser, false);
            setCurrentUser(updatedUser);

            setLiveNotice({
              message: '⏱️ تم تجديد فترة التجربة (5 دقائق) لحسابك من الإدارة وتفعيلها فوراً!',
              type: 'success',
            });
            setTimeout(() => setLiveNotice(null), 7000);
          }
        }
      },
      currentUser.email
    );

    return () => {
      unsub?.();
    };
  }, [currentUser?.id, currentUser?.email]);

  // 5-Minute Trial Timer Interval (Smooth 1-second ticks based on absolute timestamp)
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
      if (isForceUnlocked) return;
      if (currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) return;

      // 1. Tick logged-in user trial
      if (currentUser && currentUser.subscription.status === 'trial') {
        setCurrentUser((prev) => {
          if (!prev || prev.role === 'admin' || prev.subscription.status !== 'trial') return prev;
          const updated = AuthService.tickTrial(prev);
          return { ...updated };
        });
      } else if (!currentUser) {
        // 2. Tick persistent device trial for guests
        const deviceSec = AuthService.tickDeviceTrial();
        if (deviceSec <= 0) {
          AuthService.lockDevice();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser?.id, currentUser?.subscription?.status, currentUser?.subscription?.isExpired, currentUser?.role, isForceUnlocked]);

  const handleUpdateSettings = (newPartial: Partial<ReaderSettings>) => {
    const updated = StorageService.saveSettings(newPartial);
    setSettings(updated);
  };

  const handleSelectContent = (item: ContentItem) => {
    setSelectedContent(item);
    setActiveTab('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    setIsAuthModalOpen(false);
    refreshUser();
    refreshStats();
  };

  const handleSignOut = () => {
    AuthService.signOut();
    FirebaseService.signOutReal().catch(() => {});
    setCurrentUser(null);
    setIsForceUnlocked(false);
    setIsAdminModalOpen(false);
    setIsSettingsOpen(false);
    setIsGuideOpen(false);
    setIsTWAGuideOpen(false);
    setIsAuthModalOpen(true);
  };

  const handleAdminSuccess = (adminUser: AuthUser) => {
    setCurrentUser(adminUser);
    setIsForceUnlocked(true);
    setIsAdminModalOpen(true);
    refreshUser();
    refreshStats();
  };

  // Check if current user is admin
  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === 'admin' ||
      currentUser.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()
    )
  );

  // Active paid or lifetime subscription
  const hasPaidAccess = Boolean(
    currentUser && (
      currentUser.subscription?.status === 'lifetime' ||
      (currentUser.subscription?.status === 'active' && !currentUser.subscription?.isExpired)
    )
  );

  const isDevicePermanentlyUnlocked = AuthService.isDeviceUnlocked();
  const isDeviceTrialLocked = !isDevicePermanentlyUnlocked && AuthService.isDeviceLocked();
  const isUserExpired = Boolean(
    currentUser && (currentUser.subscription?.isExpired || currentUser.subscription?.status === 'expired')
  );
  const isLicenseExpired = Boolean(licenseConfig.expiresAt && licenseConfig.expiresAt <= nowTimestamp);

  // If app is stopped or globally locked by Admin, all non-admins are locked out!
  const isAppKilled = Boolean(globalAppState.isAppLocked || licenseConfig.isManuallyStopped);

  // The lock screen appears if the app is killed, or if trial/subscription is expired
  const isLocked = !isAdmin && (
    isAppKilled ||
    (!isForceUnlocked && !hasPaidAccess && (
      (isLicenseExpired && !isDevicePermanentlyUnlocked) ||
      isUserExpired ||
      (!isDevicePermanentlyUnlocked && isDeviceTrialLocked)
    ))
  );

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

      {/* Google / Real Email Sign-in Modal - Mandatory when not signed in, cannot be closed or bypassed */}
      <GoogleAuthModal
        isOpen={!currentUser || isAuthModalOpen}
        canClose={Boolean(currentUser)}
        onClose={() => {
          if (currentUser) {
            setIsAuthModalOpen(false);
          }
        }}
        onSuccess={(rawUser) => {
          const user = AuthService.normalizeUser(rawUser);
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          FirebaseService.syncUserToCloud(user).catch(() => {});
          if (user.subscription.status === 'lifetime' || user.subscription.status === 'active' || user.role === 'admin') {
            setIsForceUnlocked(true);
            AuthService.unlockDevice();
          } else {
            setIsForceUnlocked(false);
          }
          if (user.role === 'admin' || user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
            AuthService.setAdminSessionAuthenticated();
            setIsAdminModalOpen(true);
          }
          refreshStats();
        }}
        isArabic={isArabic}
      />

      {/* Instant Real-time Notification Banner */}
      {liveNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-bounce">
          <div className={`p-4 rounded-2xl shadow-2xl border text-sm font-bold flex items-center justify-between gap-3 ${
            liveNotice.type === 'success' 
              ? 'bg-emerald-900/95 text-emerald-100 border-emerald-500/80 shadow-emerald-950/50' 
              : liveNotice.type === 'error'
              ? 'bg-rose-900/95 text-rose-100 border-rose-500/80 shadow-rose-950/50'
              : 'bg-amber-900/95 text-amber-100 border-amber-500/80 shadow-amber-950/50'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>{liveNotice.message}</span>
            </div>
            <button 
              onClick={() => setLiveNotice(null)}
              className="text-white/80 hover:text-white text-xs px-2 py-1 rounded-lg bg-black/20 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Lockout Barrier:
          Blocks the entire app when locked, stopped, or trial/validity expired.
          Displays the exact WhatsApp message and device ID,
          and allows admin login with original code password (4704600vdlhs@) to open original Admin Panel */}
      {isLocked && (
        <LockoutScreen
          config={licenseConfig}
          onConfigChange={(newCfg) => {
            setLicenseConfig(newCfg);
            saveLicenseConfig(newCfg);
            refreshUser();
            refreshStats();
          }}
          openFullAdminPanel={() => setIsAdminModalOpen(true)}
          onAdminSuccess={handleAdminSuccess}
          userEmail={currentUser?.email}
          onUnlock={handleUnlockSuccess}
          customReason={globalAppState.lockReason}
        />
      )}

      {/* Admin Panel Modal for Owner */}
      <ErrorBoundary fallbackTitle="لوحة تحكم المدير" fallbackMessage="تعذر فتح لوحة التحكم. اضغط لإعادة المحاولة.">
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
      </ErrorBoundary>

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
