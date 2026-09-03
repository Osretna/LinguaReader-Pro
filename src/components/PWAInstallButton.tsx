import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  isArabic?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ isArabic = true }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled) {
    return (
      <div 
        id="pwa-installed-badge"
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
        title="التطبيق مثبت ويعمل كـ PWA"
      >
        <Check className="w-3.5 h-3.5 text-emerald-600" />
        <span>{isArabic ? 'تطبيق مثبت' : 'App Installed'}</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    await install();
    setIsInstalling(false);
  };

  return (
    <>
      {isInstallable && (
        <button
          id="pwa-install-header-btn"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-sm transition-all duration-150 cursor-pointer"
          title={isArabic ? 'تثبيت التطبيق على جهازك' : 'Install PWA app'}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isArabic ? 'تثبيت التطبيق' : 'Install App'}</span>
        </button>
      )}

      {isIOS && (
        <button
          id="pwa-ios-guide-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold transition cursor-pointer"
          title="تثبيت على iPhone أو iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          <span>{isArabic ? 'تثبيت iOS' : 'Install iOS'}</span>
        </button>
      )}

      {showIOSGuide && (
        <div 
          id="ios-install-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div 
            id="ios-install-card"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isArabic ? 'تثبيت التطبيق على iPhone / iPad' : 'Install on iPhone / iPad'}
                </h3>
              </div>
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <p>
                  {isArabic ? 'اضغط على زر المشاركة' : 'Tap the Share icon'} (
                  <span className="font-semibold text-indigo-700">Share / المشاركة</span>
                  ) {isArabic ? 'في شريط متصفح Safari السفلي.' : 'in Safari.'}
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <p>
                  {isArabic ? 'مرر للأسفل واختر' : 'Scroll down and select'} "
                  <span className="font-semibold text-indigo-700">
                    {isArabic ? 'إضافة إلى الصفحة الرئيسية (Add to Home Screen)' : 'Add to Home Screen'}
                  </span>
                  ".
                </p>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                <p>
                  {isArabic ? 'اضغط على "إضافة" (Add) في الزاوية العلوية ليظهر التطبيق كأيقونة على شاشتك.' : 'Tap "Add" in top right.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 transition shadow-sm"
            >
              {isArabic ? 'فهمت ذلك' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
