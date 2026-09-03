import React, { useState } from 'react';
import { X, Globe, Volume2, ShieldCheck, Trash2, Check, RefreshCw } from 'lucide-react';
import { ReaderSettings } from '../types';
import { TTSService } from '../services/tts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onSaveSettings: (settings: Partial<ReaderSettings>) => void;
  isArabic: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  isArabic,
}) => {
  if (!isOpen) return null;

  const [testedAudio, setTestedAudio] = useState(false);

  const testAudioVoice = () => {
    setTestedAudio(true);
    TTSService.speak({
      text: 'LinguaReader Pro empowers your reading in any language.',
      lang: settings.targetLanguage,
      rate: settings.speechRate,
    });
    setTimeout(() => setTestedAudio(false), 2000);
  };

  return (
    <div 
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        id="settings-card"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100"
        onClick={(e) => e.stopPropagation()}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isArabic ? 'إعدادات المنصة واللغات' : 'App & Language Settings'}
              </h2>
              <p className="text-xs text-slate-500">
                {isArabic ? 'تخصيص اللغات، النطق الصوتي، والمزامنة' : 'Configure languages, audio & offline cache'}
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

        <div className="space-y-6 text-xs text-slate-700">
          
          {/* Language Pair */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              {isArabic ? 'ثنائية اللغات للتعلم والترجمة' : 'Language Configuration'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">
                  {isArabic ? 'لغتك الأم (للترجمة والشرح):' : 'Native Language (Explanations):'}
                </label>
                <select
                  value={settings.nativeLanguage}
                  onChange={(e) => onSaveSettings({ nativeLanguage: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-indigo-500"
                >
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">English (الإنجليزية)</option>
                  <option value="fr">Français (الفرنسية)</option>
                  <option value="es">Español (الإسبانية)</option>
                  <option value="tr">Türkçe (التركية)</option>
                  <option value="de">Deutsch (الألمانية)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  {isArabic ? 'اللغة المستهدفة للتعلم:' : 'Target Learning Language:'}
                </label>
                <select
                  value={settings.targetLanguage}
                  onChange={(e) => onSaveSettings({ targetLanguage: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-indigo-500"
                >
                  <option value="en">English (الإنجليزية)</option>
                  <option value="fr">Français (الفرنسية)</option>
                  <option value="es">Español (الإسبانية)</option>
                  <option value="de">Deutsch (الألمانية)</option>
                  <option value="it">Italiano (الإيطالية)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audio & Pronunciation */}
          <div className="space-y-3 border-t border-slate-100 pt-5">
            <h3 className="font-bold text-slate-900 text-sm">
              {isArabic ? 'إعدادات النطق الصوتي (TTS)' : 'Speech & Audio'}
            </h3>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-semibold block">{isArabic ? 'النطق التلقائي عند النقر' : 'Auto-speak on tap'}</span>
                <span className="text-[11px] text-slate-400">{isArabic ? 'قراءة الكلمة صوتياً بمجرد لمسها' : 'Pronounce word instantly when clicked'}</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSpeakOnTap}
                onChange={(e) => onSaveSettings({ autoSpeakOnTap: e.target.checked })}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold">{isArabic ? 'سرعة النطق الصوتي:' : 'Speech Speed:'}</label>
                <span className="font-bold text-indigo-600">{settings.speechRate}x</span>
              </div>
              <div className="flex items-center gap-2">
                {[0.75, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => onSaveSettings({ speechRate: rate })}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition ${
                      settings.speechRate === rate
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}

                <button
                  onClick={testAudioVoice}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-white font-semibold flex items-center gap-1 hover:bg-slate-700 transition"
                  title="اختبر صوت النطق الآن"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{testedAudio ? 'يقرأ...' : 'اختبار'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* AdSense & Monetization Readiness */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-950 text-xs mb-0.5">
                {isArabic ? 'جاهزية الإعلانات (Google AdSense / ads.txt)' : 'Google AdSense Ready'}
              </h4>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {isArabic 
                  ? 'تم تهيئة ملف /ads.txt في الجذر مع وسم AdSense في الصفحة الرئيسية للموافقة الفورية عند ربط الحساب.'
                  : '/ads.txt is configured with AdSense verification script ready.'}
              </p>
            </div>
          </div>

        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
          >
            {isArabic ? 'حفظ وإغلاق' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
