import React, { useState } from 'react';
import { X, Copy, Check, Terminal, ShieldCheck, Sparkles, Smartphone } from 'lucide-react';

interface TWAGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isArabic?: boolean;
}

export const TWAGuideModal: React.FC<TWAGuideModalProps> = ({ isOpen, onClose, isArabic = true }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';

  const steps = [
    {
      title: isArabic ? '1. تثبيت أداة Bubblewrap CLI الرسمية من Google' : '1. Install official Bubblewrap CLI',
      desc: isArabic ? 'تأكد من وجود Node.js 18+ و Java JDK مثبتين على جهازك:' : 'Ensure Node.js and Java are installed:',
      cmd: 'npm install -g @bubblewrap/cli',
    },
    {
      title: isArabic ? '2. تهيئة مشروع TWA باستخدام رابط الـ Manifest' : '2. Initialize TWA using Manifest URL',
      desc: isArabic ? 'قم بتشغيل الأمر في مجلد جديد لتوليد إعدادات تطبيق الأندرويد تلقائياً من الـ PWA:' : 'Run init in a new directory:',
      cmd: `bubblewrap init --manifest=${currentOrigin}/manifest.json`,
    },
    {
      title: isArabic ? '3. بناء حزمة Android APK و AAB لمتجر Google Play' : '3. Build APK and Play Store AAB',
      desc: isArabic ? 'يقوم هذا الأمر بتجميع التطبيق مع توقيع المفتاح (Keystore):' : 'Compiles the project and outputs signed APK:',
      cmd: 'bubblewrap build',
    },
    {
      title: isArabic ? '4. التحقق من الربط الرقمي (Digital Asset Links)' : '4. Verify Digital Asset Links',
      desc: isArabic ? 'لإزالة شريط عنوان المتصفح تماماً داخل تطبيق الأندرويد، أنشئ الملف في مجلد `.well-known/assetlinks.json`:' : 'Create .well-known/assetlinks.json to hide browser URL bar:',
      cmd: `[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.linguareader.pro",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT_FROM_KEYSTORE"]
  }
}]`,
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div 
      id="twa-guide-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        id="twa-guide-modal-card"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isArabic ? 'دليل تحويل PWA إلى Android APK / AAB (TWA)' : 'PWA to Android TWA Guide'}
              </h2>
              <p className="text-xs text-slate-500">
                {isArabic ? 'باستخدام أداة Bubblewrap الرسمية من فريق Google Chrome' : 'Powered by official Google Chrome Bubblewrap'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900 leading-relaxed">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              {isArabic 
                ? 'تطبيق LinguaReader Pro مُهيأ بالكامل بمعايير الـ PWA، Manifest، Service Worker، وقياسات الأيقونات (192، 512، Maskable)، مما يجعله جاهزاً بنسبة 100% للتوليد السريع بواسطة Bubblewrap بدون كتابة أكواد Kotlin إضافية.'
                : 'LinguaReader Pro is 100% compliant with standard PWA, manifest and maskable icons for instant Bubblewrap generation.'}
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                  <button
                    onClick={() => handleCopy(step.cmd, idx)}
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition shadow-xs"
                    title="نسخ الأمر"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">{isArabic ? 'تم النسخ' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'نسخ' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-600 mb-2">{step.desc}</p>
                <pre 
                  dir="ltr" 
                  className="p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto selection:bg-indigo-600 selection:text-white"
                >
                  {step.cmd}
                </pre>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-900">
              <p className="font-bold">{isArabic ? 'النتيجة بعد تنفيذ الخطوات:' : 'Expected Outcome:'}</p>
              <p>{isArabic ? 'ستحصل على ملف app-release-signed.apk صالح للتثبيت المباشر على أي هاتف أندرويد، وملف app-release-bundle.aab جاهز للنشر الفوري على متجر Google Play.' : 'Signed APK ready to install and AAB bundle ready for Google Play upload.'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            {isArabic ? 'إغلاق الدليل' : 'Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
};
