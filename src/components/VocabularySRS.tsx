import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Layers, 
  RotateCw, 
  Volume2, 
  Check, 
  Trash2, 
  Download, 
  Sparkles, 
  Calendar, 
  Flame, 
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { VocabularyWord } from '../types';
import { StorageService } from '../services/storage';
import { calculateSM2, isDueForReview, formatIntervalDisplay } from '../services/srs';
import { TTSService } from '../services/tts';
import confetti from 'canvas-confetti';

interface VocabularySRSProps {
  isArabic: boolean;
}

export const VocabularySRS: React.FC<VocabularySRSProps> = ({ isArabic }) => {
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'review' | 'list'>('review');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('all');

  // Flashcards session state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = () => {
    const list = StorageService.getVocabulary();
    setVocabulary(list);
  };

  // Due words for today's review
  const dueWords = vocabulary.filter(isDueForReview);

  // Review candidates (if no due words, can review all words)
  const studyQueue = dueWords.length > 0 ? dueWords : vocabulary;
  const currentWord = studyQueue[currentCardIndex];

  // Handle grade answer (0 = Blackout, 2 = Hard, 4 = Good, 5 = Easy)
  const handleGrade = (grade: number) => {
    if (!currentWord) return;

    const newSrs = calculateSM2(currentWord, grade);
    const updatedWord: VocabularyWord = {
      ...currentWord,
      ...newSrs,
      history: [
        ...(currentWord.history || []),
        { date: new Date().toISOString().split('T')[0], grade },
      ],
    };

    StorageService.updateWordSRS(updatedWord);
    loadVocabulary();
    setIsFlipped(false);

    if (currentCardIndex + 1 < studyQueue.length) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setSessionCompleted(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestartSession = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  const handleDeleteWord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.removeWord(id);
    loadVocabulary();
  };

  const handleExportAnki = () => {
    const csvContent = StorageService.exportAnkiCSV();
    const blob = new Blob([csvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LinguaReader-Vocabulary-Anki-${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered list
  const filteredList = vocabulary.filter((w) => {
    const matchesSearch =
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.translation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevelFilter === 'all' || w.level === selectedLevelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div id="vocabulary-srs-page" className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isArabic ? 'قاموسي الذكي والتكرار المتباعد (SRS)' : 'Vocabulary & Spaced Repetition (SRS)'}
              </h1>
              <p className="text-xs text-slate-500">
                {isArabic 
                  ? 'خوارزمية SM-2 العلمية لترسيخ الكلمات في الذاكرة طويلة المدى'
                  : 'Scientifically proven SuperMemo-2 algorithm for long-term retention'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="export-anki-btn"
            onClick={handleExportAnki}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs cursor-pointer"
            title="تصدير إلى تطبيق Anki"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{isArabic ? 'تصدير Anki' : 'Export to Anki'}</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveSubTab('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'review' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isArabic ? `جلسة المراجعة (${dueWords.length})` : `Review (${dueWords.length})`}
            </button>
            <button
              onClick={() => setActiveSubTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              {isArabic ? `جميع الكلمات (${vocabulary.length})` : `Word List (${vocabulary.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: Flashcards Review Session */}
      {activeSubTab === 'review' && (
        <div className="max-w-xl mx-auto">
          {sessionCompleted ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {isArabic ? 'رائع! أكملت مراجعة اليوم بنجاح 🎉' : 'Awesome! Daily review completed 🎉'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
                {isArabic
                  ? 'تم تحديث فترات التكرار المتباعد لجميع الكلمات وفقاً لمستويات استذكارك. الكلمات ستظهر مجدداً في الموعد المثالي لمراجعتها.'
                  : 'Spaced repetition intervals have been recalculated based on your responses.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleRestartSession}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  {isArabic ? 'مراجعة مرة أخرى' : 'Review Again'}
                </button>
                <button
                  onClick={() => setActiveSubTab('list')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                >
                  {isArabic ? 'عرض كل الكلمات' : 'View All Words'}
                </button>
              </div>
            </div>
          ) : currentWord ? (
            <div className="space-y-6">
              
              {/* Progress counter */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>
                  {isArabic ? `البطاقة ${currentCardIndex + 1} من ${studyQueue.length}` : `Card ${currentCardIndex + 1} of ${studyQueue.length}`}
                </span>
                <span className="flex items-center gap-1 text-indigo-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  {dueWords.length > 0 
                    ? (isArabic ? `${dueWords.length} كلمات مستحقة اليوم` : `${dueWords.length} due today`) 
                    : (isArabic ? 'وضع الاستذكار الحر' : 'Free practice')}
                </span>
              </div>

              {/* Interactive Flip Card */}
              <div
                id="srs-flashcard"
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[340px] rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-xl cursor-pointer transition-all duration-300 hover:border-indigo-300 flex flex-col justify-between select-none relative overflow-hidden"
              >
                {/* Level Tag & Audio Button */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3" dir="ltr">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold">
                      {currentWord.level || 'B1'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {currentWord.partOfSpeech || 'Word'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      TTSService.speak({ text: currentWord.word, lang: currentWord.language });
                    }}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition"
                    title="استمع للنطق"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Card Center: Front (Target Word) or Back (Translation) */}
                <div className="text-center py-8">
                  {!isFlipped ? (
                    <div>
                      <h2 dir="ltr" className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                        {currentWord.word}
                      </h2>
                      {currentWord.phonetic && (
                        <p className="text-sm font-mono text-slate-400">{currentWord.phonetic}</p>
                      )}
                      <p className="mt-8 text-xs text-indigo-500 font-semibold flex items-center justify-center gap-1.5">
                        <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                        <span>{isArabic ? 'انقر لإظهار المعنى والمثال' : 'Tap to reveal translation'}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="animate-in fade-in zoom-in-95">
                      <h2 className="text-3xl font-bold text-indigo-600 mb-2">
                        {currentWord.translation}
                      </h2>
                      {currentWord.exampleSentence && (
                        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                          <p dir="ltr" className="font-serif italic text-slate-800">
                            "{currentWord.exampleSentence}"
                          </p>
                          {currentWord.exampleTranslation && (
                            <p className="text-slate-500 mt-1">{currentWord.exampleTranslation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer info */}
                <div className="text-center text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                  <span>
                    {isArabic 
                      ? `فترة المراجعة الحالية: ${formatIntervalDisplay(currentWord.interval, true)}`
                      : `Current Interval: ${formatIntervalDisplay(currentWord.interval, false)}`}
                  </span>
                </div>
              </div>

              {/* SRS Grade Response Buttons (Show when flipped) */}
              {isFlipped ? (
                <div className="grid grid-cols-4 gap-2 pt-2 animate-in slide-in-from-bottom-2">
                  <button
                    onClick={() => handleGrade(1)}
                    className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-center transition cursor-pointer"
                  >
                    <span className="block text-sm font-bold">{isArabic ? 'نسيت 😵' : 'Again'}</span>
                    <span className="text-[10px] opacity-75">{isArabic ? 'إعادة اليوم' : 'Today'}</span>
                  </button>

                  <button
                    onClick={() => handleGrade(2)}
                    className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-center transition cursor-pointer"
                  >
                    <span className="block text-sm font-bold">{isArabic ? 'صعب 🤔' : 'Hard'}</span>
                    <span className="text-[10px] opacity-75">{isArabic ? 'غداً' : '1 day'}</span>
                  </button>

                  <button
                    onClick={() => handleGrade(4)}
                    className="p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-center transition cursor-pointer"
                  >
                    <span className="block text-sm font-bold">{isArabic ? 'جيد 👍' : 'Good'}</span>
                    <span className="text-[10px] opacity-75">{isArabic ? '3-6 أيام' : '3-6 days'}</span>
                  </button>

                  <button
                    onClick={() => handleGrade(5)}
                    className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-center transition cursor-pointer"
                  >
                    <span className="block text-sm font-bold">{isArabic ? 'سهل جداً 🚀' : 'Easy'}</span>
                    <span className="text-[10px] opacity-75">{isArabic ? 'أسبوعان+' : '2+ wks'}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsFlipped(true)}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition"
                >
                  {isArabic ? 'إظهار الإجابة' : 'Reveal Answer'}
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                {isArabic ? 'قاموسك فارغ حالياً' : 'Your dictionary is empty'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isArabic 
                  ? 'اذهب إلى المكتبة واقرأ أي نص؛ عند النقر على أي كلمة ستُضاف إلى قاموسك الشخصي تلقائياً لمراجعتها هنا.'
                  : 'Start reading any text in the Library; tap any word to save it here for SRS review.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: All Words Management List */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          {/* Filters and search */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isArabic ? 'ابحث في كلماتك المحفوظة...' : 'Search saved words...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-semibold focus:outline-indigo-500 cursor-pointer"
              >
                <option value="all">{isArabic ? 'جميع المستويات' : 'All Levels'}</option>
                <option value="A1">Level A1</option>
                <option value="A2">Level A2</option>
                <option value="B1">Level B1</option>
                <option value="B2">Level B2</option>
                <option value="C1">Level C1</option>
                <option value="C2">Level C2</option>
              </select>
            </div>
          </div>

          {/* Words Grid */}
          {filteredList.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
              {isArabic ? 'لا توجد كلمات مطابقة لبحثك' : 'No words matched your search.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.map((word) => {
                const due = isDueForReview(word);

                return (
                  <div
                    key={word.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs transition flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-1.5" dir="ltr">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 capitalize">
                            {word.word}
                          </h4>
                          <button
                            onClick={() => TTSService.speak({ text: word.word, lang: word.language })}
                            className="text-slate-400 hover:text-indigo-600 p-0.5 rounded"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {word.level || 'B1'}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-indigo-600 mb-1">
                        {word.translation}
                      </p>

                      {word.exampleSentence && (
                        <p dir="ltr" className="text-xs text-slate-500 italic truncate font-serif">
                          "{word.exampleSentence}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                      <span className={due ? 'text-amber-600 font-bold' : ''}>
                        {due 
                          ? (isArabic ? 'مستحقة للمراجعة الآن' : 'Due for review') 
                          : formatIntervalDisplay(word.interval, isArabic)}
                      </span>

                      <button
                        onClick={(e) => handleDeleteWord(word.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-1"
                        title="حذف من القاموس"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
