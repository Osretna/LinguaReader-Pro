import React, { useState } from 'react';
import { SavedWord } from '../types';
import { 
  Bookmark, 
  Search, 
  Volume2, 
  Trash2, 
  Sparkles, 
  Layers, 
  RotateCw, 
  Check, 
  X, 
  Award,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VocabularyViewProps {
  savedWords: SavedWord[];
  onRemoveWord: (wordText: string) => void;
  onUpdateWordLevel: (wordId: string, delta: number) => void;
}

export const VocabularyView: React.FC<VocabularyViewProps> = ({
  savedWords,
  onRemoveWord,
  onUpdateWordLevel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const playPronunciation = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredWords = savedWords.filter(w => 
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.translation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentCard = filteredWords[currentCardIndex];

  const handleNextCard = (rating: 'easy' | 'good' | 'hard') => {
    if (!currentCard) return;

    if (rating === 'easy') {
      onUpdateWordLevel(currentCard.id, 1);
      confetti({ particleCount: 20 });
    } else if (rating === 'hard') {
      onUpdateWordLevel(currentCard.id, -1);
    }

    setIsFlipped(false);
    if (currentCardIndex < filteredWords.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setIsStudyMode(false);
      setCurrentCardIndex(0);
      confetti({ particleCount: 60 });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">دفتر المفردات والبطاقات التعليمية</h2>
            <p className="text-xs text-slate-400">
              مراجعة الكلمات المحفوظة أثناء القراءة باستخدام نظام التكرار المتباعد
            </p>
          </div>
        </div>

        {savedWords.length > 0 && (
          <button
            onClick={() => {
              setIsStudyMode(!isStudyMode);
              setIsFlipped(false);
              setCurrentCardIndex(0);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow ${
              isStudyMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/20'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isStudyMode ? 'العودة لقائمة الكلمات' : `بدء مراجعة البطاقات (${savedWords.length})`}</span>
          </button>
        )}
      </div>

      {savedWords.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">لم تحفظ أي كلمات بعد</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            أثناء قراءة أي قصة أو مقال في قسم القارئ، انقر على أي كلمة تريد حفظها واضغط على رمز النجمة/العلامة لتظهر لك هنا تلقائياً.
          </p>
        </div>
      ) : isStudyMode && currentCard ? (
        /* Flashcard Mode */
        <div className="max-w-lg mx-auto space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>البطاقة {currentCardIndex + 1} من {filteredWords.length}</span>
            <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-400 h-full transition-all duration-300"
                style={{ width: `${((currentCardIndex + 1) / filteredWords.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Flashcard Body */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[280px] bg-slate-900 border-2 border-slate-700 hover:border-amber-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-2xl relative transition-all duration-300 transform hover:scale-[1.01]"
          >
            <div className="absolute top-4 right-4 text-xs text-slate-400 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              <span>انقر لقلب البطاقة</span>
            </div>

            {!isFlipped ? (
              /* Front Side (English) */
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Word / الكلمة</span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-display dir-ltr">
                  {currentCard.word}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playPronunciation(currentCard.word);
                  }}
                  className="p-3 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded-2xl transition cursor-pointer mx-auto inline-flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>استماع للنطق</span>
                </button>
              </div>
            ) : (
              /* Back Side (Arabic & Context) */
              <div className="space-y-4 animate-fadeIn">
                <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">الترجمة والمعنى</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-amber-300">
                  {currentCard.translation}
                </h3>
                {currentCard.contextSentence && (
                  <p className="text-xs text-slate-300 dir-ltr italic bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    "{currentCard.contextSentence}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Rating Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleNextCard('hard')}
              className="py-3 px-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              صعبة (مراجعة قريباً)
            </button>
            <button
              onClick={() => handleNextCard('good')}
              className="py-3 px-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              جيدة
            </button>
            <button
              onClick={() => handleNextCard('easy')}
              className="py-3 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              سهلة (أتقنتها) ✨
            </button>
          </div>
        </div>
      ) : (
        /* Words Table & Search */
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في الكلمات المحفوظة أو الترجمة..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredWords.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 transition hover:border-slate-700 space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-white font-display dir-ltr text-left">
                      {item.word}
                    </h4>
                    <span className="text-xs text-amber-400 font-semibold block mt-0.5">
                      {item.translation}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => playPronunciation(item.word)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="استماع"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveWord(item.word)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.contextSentence && (
                  <p className="text-[11px] text-slate-400 dir-ltr text-left italic border-r-2 border-slate-700 pr-2 line-clamp-2">
                    "{item.contextSentence}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>تم الحفظ: {new Date(item.addedAt).toLocaleDateString('ar-EG')}</span>
                  <span className="text-emerald-400 font-semibold">مستوى الإتقان: {item.masteryPercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
