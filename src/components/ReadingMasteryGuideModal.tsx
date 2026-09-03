import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  BrainCircuit, 
  Volume2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Zap,
  Target,
  Flame,
  Award,
  Mic,
  Lightbulb
} from 'lucide-react';

interface ReadingMasteryGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartVoiceTest: () => void;
  onGoToLibrary: () => void;
  onGoToSRS: () => void;
  isArabic: boolean;
}

export const ReadingMasteryGuideModal: React.FC<ReadingMasteryGuideModalProps> = ({
  isOpen,
  onClose,
  onStartVoiceTest,
  onGoToLibrary,
  onGoToSRS,
  isArabic,
}) => {
  const [activeSection, setActiveSection] = useState<'blueprint' | 'routine' | 'mistakes'>('blueprint');

  if (!isOpen) return null;

  return (
    <div 
      id="reading-mastery-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      dir={isArabic ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Header with Visual Banner */}
        <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 p-6 text-white shrink-0 overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/40 text-amber-200 text-xs font-bold mb-1">
                  <Zap className="w-3 h-3" />
                  {isArabic ? 'الدليل العلمي الشامل' : 'Science-Backed Framework'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {isArabic 
                    ? 'أسرار التعلم والطلاقة السريعة عبر القراءة الذكية' 
                    : 'How to Learn a Language Fast Through Smart Reading'}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
              title={isArabic ? 'إغلاق' : 'Close'}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Subtitle */}
          <p className="mt-3 text-sm text-indigo-100 max-w-2xl leading-relaxed relative z-10">
            {isArabic
              ? 'القراءة ليست مجرد حفظ كلمات، بل هي الطريقة الأسرع لبرمجة عقلك على التفكير باللغة الأجنبية مباشرة. إليك الخطوات العلمية الست للانتقال من مرحلة التردد إلى الطلاقة في أقصر وقت.'
              : 'Reading is not about memorizing isolated lists—it is the fastest way to rewire your brain to think directly in the language. Here is the 6-step science-backed system for rapid fluency.'}
          </p>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-5 border-t border-white/15 pt-3 relative z-10">
            <button
              onClick={() => setActiveSection('blueprint')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'blueprint'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {isArabic ? 'المنهجية السداسية الذهبية' : 'The 6 Core Pillars'}
            </button>

            <button
              onClick={() => setActiveSection('routine')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'routine'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {isArabic ? 'جدول الـ 20 دقيقة اليومي' : '20-Min Daily Routine'}
            </button>

            <button
              onClick={() => setActiveSection('mistakes')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSection === 'mistakes'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {isArabic ? 'أخطاء قاتلة تجنبها' : 'Pitfalls to Avoid'}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-sm leading-relaxed">
          
          {/* SECTION 1: The 6 Core Pillars */}
          {activeSection === 'blueprint' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Pillar 1 */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 hover:border-indigo-300 transition shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isArabic ? 'قانون المدخلات المفهومة (i + 1)' : 'Comprehensible Input (i + 1)'}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    {isArabic 
                      ? 'السر الأول لسرعة التعلم هو اختيار نصوص تفهم منها 70% إلى 85%. إذا كان النص صعباً جداً (>30% كلمات مجهولة) يتوقف الدماغ عن الاستيعاب ويصاب بالإحباط. وإذا كان سهلاً جداً فلن تتطور. ابحث عن نصوص تتحدى مستواك بدرجة واحدة فقط.'
                      : 'Aim for texts where you naturally grasp 70% to 85% of words. If a text is too hard (>30% unknown words), cognitive overload occurs and progress halts. Read at your level + 1 step challenge.'}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-indigo-100/80 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span>{isArabic ? 'نصيحة: استخدم تصنيفات CEFR في المكتبة (A1 إلى C1)' : 'Tip: Use the CEFR level filters in the Library'}</span>
                  </div>
                </div>

                {/* Pillar 2 */}
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 hover:border-purple-300 transition shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isArabic ? 'الموازنة بين القراءة المكثفة والموسعة' : 'Intensive vs. Extensive Reading'}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    {isArabic 
                      ? 'امزج بين نمطين: القراءة المكثفة (10 دقائق لتشريح فقرة وحفظ مفرداتها في الـ SRS)، والقراءة الموسعة (15 دقيقة لقراءة قصة ممتعة بدون توقف لتدريب الدماغ على التفكير باللغة الأجنبية وزيادة سرعة المعالجة).'
                      : 'Balance both: Intensive reading (deep dive into 1-2 paragraphs, analyzing grammar & saving words) + Extensive reading (reading smoothly without stopping at every word to build reading flow).'}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-purple-100/80 flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span>{isArabic ? 'الجمع بين النمطين يضاعف سرعتك 3 مرات' : 'Combining both speeds up fluency by 3x'}</span>
                  </div>
                </div>

                {/* Pillar 3 */}
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 hover:border-rose-300 transition shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isArabic ? 'تقنية التظليل الصوتي (Audio Shadowing)' : 'Audio Shadowing & Read Aloud'}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    {isArabic 
                      ? 'لا تقرأ صامتاً فقط! شغّل نطق الفقرة بصوت المتحدث الأصلي، ثم كرر القراءة بصوت مسموع وواضح. هذه التقنية تبني الذاكرة العضلية للسان وتربط الشكل الكتابي بالصوت ومخارج الحروف، وتزيل الخجل من النطق.'
                      : 'Never read purely silently. Listen to the native TTS audio, then immediately read aloud. This creates neural pathways between written text and speech articulation.'}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-rose-100/80 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
                    <Volume2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{isArabic ? 'اضغط زر النطق الصوتي في القارئ بجانب أي فقرة' : 'Tap the audio button next to any paragraph'}</span>
                  </div>
                </div>

                {/* Pillar 4 */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 hover:border-emerald-300 transition shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      4
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isArabic ? 'التعدين السياقي للمفردات (Contextual Mining)' : 'Contextual Vocabulary Mining'}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    {isArabic 
                      ? 'توقف عن حفظ قواميس الكلمات المجردة (مثل: dog = كلب). احفظ الكلمة دائماً داخل جملتها الأصلية! الجملة تعطيك حروف الجر الصحيحة، التراكيب المصاحبة (Collocations)، والسياق العاطفي الذي يجعل الكلمة تستقر في الذاكرة.'
                      : 'Avoid rote word lists. Save words with their complete sentences. Sentences provide prepositions, collocations, and emotional context that anchor words permanently in your memory.'}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-emerald-100/80 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                    <span>{isArabic ? 'تطبيقنا يحفظ تلقائياً الجملة ومصدرها عند إضافة أي كلمة' : 'Our app auto-attaches sentences when saving words'}</span>
                  </div>
                </div>

                {/* Pillar 5 */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 hover:border-amber-300 transition shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                      5
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isArabic ? 'التكرار المتباعد الذكي (Spaced Repetition SRS)' : 'Spaced Repetition System (SRS)'}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    {isArabic 
                      ? 'العقل البشري ينسى 70% من الكلمات الجديدة خلال 24 ساعة إذا لم تتم مراجعتها (منحنى النسيان لإبنجهاوس). نظام الـ SRS في التطبيق يعيد عرض الكلمة في اللحظة التي يوشك عقلك على نسيانها (اليوم 1، ثم 3، ثم 7، ثم 14).'
                      : 'Without review, human memory loses 70% of new words within 24 hours. Spaced Repetition reviews words right before you forget them, cementing them into long-term memory.'}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-amber-100/80 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                    <BrainCircuit className="w-3.5 h-3.5 shrink-0" />
                    <span>{isArabic ? 'راجع بطاقاتك يومياً في تبويب (قاموسي SRS)' : 'Review your flashcards daily in Vocabulary (SRS)'}</span>
                  </div>
                </div>

                {/* Pillar 6 */}
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 hover:border-sky-300 transition shadow-xs">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                      6
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {isArabic ? 'اختبار النطق والمحادثة الصوتية الدورية' : 'Active Voice Testing & Output'}
                    </h3>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm">
                    {isArabic 
                      ? 'القراءة مدخلات (Input)، والطلاقة تحتاج إلى مخرجات (Output). قم بإجراء اختبار المحادثة الصوتية التفاعلي مع التطبيق مرة كل أسبوع لتقييم مستواك، فحص مخارج حروفك، وتدريب لسانك على صياغة الأفكار الفورية.'
                      : 'Reading is input; speaking is output. Use our interactive voice assessment once a week to test your speech, grammar fluency, and articulation with real AI feedback.'}
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-sky-100/80 flex items-center gap-1.5 text-[11px] font-semibold text-sky-700">
                    <Mic className="w-3.5 h-3.5 shrink-0" />
                    <span>{isArabic ? 'جرب ميزة "اختبار المستوى الصوتي" الجديدة في التطبيق' : 'Try the new Voice Level Diagnostic feature'}</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SECTION 2: 20-Minute Daily Routine */}
          {activeSection === 'routine' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 mb-4">
                <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1 text-base">
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>{isArabic ? 'قوة العادات الذرية: 20 دقيقة يومياً تغير مستواك جذرياً' : 'The 20-Minute Daily Fluency Habit'}</span>
                </div>
                <p className="text-slate-600 text-xs sm:text-sm">
                  {isArabic 
                    ? 'دراسة 20 دقيقة كل يوم تحقق نتائج أسرع بـ 5 أضعاف من دراسة 3 ساعات متواصلة في عطلة نهاية الأسبوع. إليك التقسيم المثالي للوقت:'
                    : '20 minutes every day yields 5x better long-term retention than 3 hours crammed on weekends. Here is your optimal breakdown:'}
                </p>
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs">دقائق</span>
                    <span className="text-sm font-black">5</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      {isArabic ? 'المرحلة 1: تنشيط الذاكرة (مراجعة بطاقات الـ SRS المستحقة)' : 'Phase 1: Memory Activation (SRS Review)'}
                    </h4>
                    <p className="text-slate-600 text-xs">
                      {isArabic
                        ? 'ابدأ يومك بفتح تبويب (قاموسي SRS) ومراجعة 10 إلى 15 بطاقة مستحقة. قيم درجة تذكرك (سهل، متوسط، صعب). هذا يوقظ شبكات اللغة في عقلك.'
                        : 'Review 10-15 due cards in your SRS Vocabulary bank. Rate your recall. This primes your language neural network for the day.'}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 font-bold flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs">دقائق</span>
                    <span className="text-sm font-black">10</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      {isArabic ? 'المرحلة 2: القراءة النشطة واكتشاف المفردات (Active Reading)' : 'Phase 2: Active Reading & Mining'}
                    </h4>
                    <p className="text-slate-600 text-xs">
                      {isArabic
                        ? 'اختر مقالاً أو فصلاً من مجالك المفضل (تقنية، تأمين، حياة يومية، قصص). اقرأ الفقرة، اضغط على الكلمات الجديدة لمعرفة معناها وترجمتها، وأضف 3 إلى 5 كلمات قوية فقط إلى قاموسك.'
                        : 'Pick an article or chapter in your field. Read attentively, tap unfamiliar words, and save 3-5 high-value words to your SRS bank.'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-bold flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs">دقائق</span>
                    <span className="text-sm font-black">5</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      {isArabic ? 'المرحلة 3: التظليل الصوتي والقراءة الجهرية (Shadowing & Speaking)' : 'Phase 3: Shadowing & Articulation'}
                    </h4>
                    <p className="text-slate-600 text-xs">
                      {isArabic
                        ? 'شغّل الصوت التفاعلي للفقرة عبر زر مكبر الصوت. اقرأ مع الصوت أو بعده مباشرة بصوت واضح ومسموع. ركز على نبرة الصوت وتناغم الكلمات.'
                        : 'Play the audio for the paragraph. Read aloud simultaneously or right after. Emphasize rhythm, intonation, and pronunciation flow.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Common Pitfalls to Avoid */}
          {activeSection === 'mistakes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* Mistake 1 */}
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <div className="flex items-center gap-2 text-rose-700 font-bold mb-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{isArabic ? 'الخطأ 1: ترجمة كل كلمة على حدة' : 'Mistake 1: Translating Every Word'}</span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    {isArabic 
                      ? 'التوقف عند كل حرف جر وأداة تعريف يدمر متعة القراءة ويبطئ تدفق الأفكار. حاول دائماً تخمين المعنى الإجمالي للفقرة أولاً، ولا تترجم إلا الكلمات المفتاحية التي تمنع فهم الفكرة الرئيسية.'
                      : 'Stopping for every tiny word disrupts flow and causes frustration. Try guessing the overall context first, and only translate key words crucial for comprehension.'}
                  </p>
                </div>

                {/* Mistake 2 */}
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <div className="flex items-center gap-2 text-rose-700 font-bold mb-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{isArabic ? 'الخطأ 2: القراءة الصامتة فقط' : 'Mistake 2: Only Silent Reading'}</span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    {isArabic 
                      ? 'القراءة الصامتة تطور مهارة الفهم (Passive Vocabulary) ولكنها تترك لسانك عاجزاً عن التحدث عند اللزوم. تحويل القراءة إلى قراءة جهرية مع الصوت يفك عقدة اللسان ويصنع الطلاقة.'
                      : 'Silent reading builds passive comprehension but leaves your speaking muscles unexercised. Reading aloud with audio transforms passive words into active fluent speech.'}
                  </p>
                </div>

                {/* Mistake 3 */}
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <div className="flex items-center gap-2 text-rose-700 font-bold mb-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{isArabic ? 'الخطأ 3: جمع مئات الكلمات دون مراجعتها' : 'Mistake 3: Hoarding Words Without SRS'}</span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    {isArabic 
                      ? 'إضافة 50 كلمة في يوم واحد دون مراجعتها هو جهد ضائع. حفظ 3 إلى 5 كلمات يومياً مع تثبيتها بنظام التكرار المتباعد يمنحك أكثر من 1500 كلمة راسخة في السنة، وهي كافية للطلاقة.'
                      : 'Saving 50 words without spaced review is wasted effort. Mastering 3-5 words daily with SRS gives you 1,500+ active words a year—more than enough for professional fluency.'}
                  </p>
                </div>

                {/* Mistake 4 */}
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                  <div className="flex items-center gap-2 text-rose-700 font-bold mb-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{isArabic ? 'الخطأ 4: اختيار نصوص معقدة جداً' : 'Mistake 4: Picking Texts That Are Too Hard'}</span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    {isArabic 
                      ? 'البدء بروايات فلسفية أو كلاسيكية قديمة يُشعر المتعلم بالعجز. ابدأ بنصوص واقعية، مثل حوارات العمل، تكنولوجيا المعلومات، والمعاملات اليومية المتوفرة في مكتبة التطبيق.'
                      : 'Starting with dense 19th-century classics causes burnout. Start with modern, practical dialogues in Tech, Work, and Daily Life tailored to your CEFR level.'}
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-start">
            {isArabic 
              ? 'جاهز للبدء؟ اختبر مستواك الصوتي الآن أو ابدأ قراءة نص جديد.' 
              : 'Ready to take action? Test your voice level or pick a new text.'}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onStartVoiceTest();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>{isArabic ? 'ابدأ اختبار مستواك الصوتي الآن' : 'Take Voice Level Test'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onGoToLibrary();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isArabic ? 'تصفح المكتبة الذكية' : 'Explore Library'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onGoToSRS();
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>{isArabic ? 'قاموسي (SRS)' : 'Vocabulary SRS'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
