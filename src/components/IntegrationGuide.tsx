import React, { useState } from 'react';
import { X, Copy, Check, Code2, BookOpen } from 'lucide-react';

interface IntegrationGuideProps {
  onClose: () => void;
}

export const IntegrationGuide: React.FC<IntegrationGuideProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const sampleSnippet = `// في ملف App.tsx في مشروعك:
import React from 'react';
import { LicenseGuard } from './components/LicenseGuard';
import YourExistingApp from './YourExistingApp';

export default function App() {
  return (
    <LicenseGuard>
      {/* هنا تضع كود تطبيقك الأصلي كما هو تماماً */}
      <YourExistingApp />
    </LicenseGuard>
  );
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100002] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">دليل ربط شاشة الحجب والصلاحيات بتطبيقك</h3>
              <p className="text-xs text-slate-400">كيف تستخدم هذا الكود مباشرة على أي تطبيق قمت ببرمجته</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            لقد تم بناء النظام بشكل معياري تماماً (Component Wrapper). بمجرد إحاطة تطبيقك بـ <code className="text-emerald-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded">&lt;LicenseGuard&gt;</code>، سيتولى النظام حجب الشاشة بالكامل فور انتهاء المدة أو عند الضغط على إيقاف التطبيق:
          </p>

          <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-left" dir="ltr">
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
            </button>
            <pre className="text-slate-300 overflow-x-auto pr-24 whitespace-pre-wrap">
              {sampleSnippet}
            </pre>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-indigo-400" />
              الميزات المتوفرة تلقائياً:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs pr-1">
              <li>شاشة حجب كاملة (Full Screen Overlay) تحجب تطبيقك عند انتهاء الوقت أو الإيقاف.</li>
              <li>الرسالة المطلوبة بالضبط: <span className="text-white font-medium">"بالرجاء التواصل مع المسؤل علي الواتساب لفتح التطبيق مرة اخري"</span>.</li>
              <li>زر مباشر يفتح محادثة واتساب مع المسؤول مع نص رسالة جاهز به معرّف جهاز العميل.</li>
              <li>أزرار سريعة للمسؤول: إضافة 5 دقائق للتجربة، إضافة يوم كامل (24 ساعة)، أو وقف التطبيق فوراً.</li>
              <li>مولد أكواد تفعيل يمكن إرسالها للعميل عبر واتساب لإدخالها في شاشة الحجب وفتح التطبيق فوراً.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
