import React, { useState, useEffect, useRef } from 'react';
import { ReadingText, WordDefinition, SavedWord, ReaderSettings } from '../types';
import { lookupWord, cleanWordString } from '../services/dictionary';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  Sliders, 
  Languages, 
  Type, 
  Check, 
  X, 
  Plus, 
  Minus, 
  FileText, 
  ArrowLeft, 
  BookOpen,
  Eye,
  Settings2,
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReaderViewProps {
  currentText: ReadingText;
  allTexts: ReadingText[];
  onSelectText: (text: ReadingText) => void;
  savedWords: SavedWord[];
  onSaveWord: (word: WordDefinition, contextSentence?: string) => void;
  onRemoveSavedWord: (wordText: string) => void;
  onCustomTextCreate: (newText: ReadingText) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  currentText,
  allTexts,
  onSelectText,
  savedWords,
  onSaveWord,
  onRemoveSavedWord,
  onCustomTextCreate
}) => {
  // Dictionary Popup State
  const [selectedWord, setSelectedWord] = useState<WordDefinition | null>(null);
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  // Audio / Speech State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number | null>(null);
  const [speechRate, setSpeechRate] = useState(1);

  // Settings
  const [fontSize, setFontSize] = useState(20);
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light' | 'oled'>('dark');
  const [bilingualMode, setBilingualMode] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom text input state
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customLevel, setCustomLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('B1');

  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Is word already saved
  const isWordSaved = (wordStr: string) => {
    const clean = cleanWordString(wordStr);
    return savedWords.some(w => cleanWordString(w.word) === clean);
  };

  // Handle clicking on any word
  const handleWordClick = async (word: string, sentence: string, event: React.MouseEvent) => {
    const clean = cleanWordString(word);
    if (!clean || clean.length === 0) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const containerRect = readerContainerRef.current?.getBoundingClientRect() || { top: 0, left: 0, width: 600, height: 800 };
    
    // Position popup near clicked word
    setPopupPosition({
      x: Math.min(Math.max(rect.left - containerRect.left, 20), (containerRect.width || 600) - 320),
      y: rect.bottom - containerRect.top + 10
    });

    setIsLoadingWord(true);
    setSelectedWord(null);

    try {
      const def = await lookupWord(word, sentence);
      setSelectedWord({
        word: def.word,
        cleanWord: clean,
        phonetic: def.phonetic,
        partOfSpeech: def.partOfSpeech,
        arabicTranslation: def.translation,
        englishDefinition: def.definition,
        exampleSentence: def.exampleSentence,
        difficulty: def.level,
        synonyms: def.synonyms,
      });
      // Auto pronounce if speech synthesis is available
      playPronunciation(clean);
    } catch (e) {
      console.error("Error looking up word:", e);
    } finally {
      setIsLoadingWord(false);
    }
  };

  // Pronounce word via SpeechSynthesis
  const playPronunciation = (textToSpeak: string, lang = 'en-US') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang;
      utterance.rate = speechRate;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Text-To-Speech Narration for whole text
  const handleTogglePlayNarration = () => {
    if (!('speechSynthesis' in window)) {
      alert('ميزة القراءة الصوتية غير مدعومة في متصفحك الحالي.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setCurrentSentenceIndex(null);
      return;
    }

    const sentences = currentText.paragraphs.map(p => p.text);
    if (sentences.length === 0) return;

    setIsPlayingAudio(true);
    let index = 0;

    const speakNextSentence = () => {
      if (index >= sentences.length) {
        setIsPlayingAudio(false);
        setCurrentSentenceIndex(null);
        return;
      }

      setCurrentSentenceIndex(index);
      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      utterance.lang = currentText.language === 'en' ? 'en-US' : currentText.language;
      utterance.rate = speechRate;

      utterance.onend = () => {
        index++;
        speakNextSentence();
      };

      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setCurrentSentenceIndex(null);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextSentence();
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentText]);

  // Handle saving new custom text
  const handleSaveCustomText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customContent.trim()) return;

    const rawParagraphs = customContent.split('\n\n').filter(p => p.trim().length > 0);
    const paragraphs = rawParagraphs.map((p, idx) => ({
      id: idx + 1,
      text: p.trim()
    }));

    const newReadingText: ReadingText = {
      id: `custom-${Date.now()}`,
      title: customTitle.trim(),
      language: 'en',
      level: customLevel,
      category: 'نصوص مخصصة / My Uploads',
      readTimeMinutes: Math.max(1, Math.round(customContent.split(' ').length / 100)),
      wordCount: customContent.split(' ').length,
      coverEmoji: '📝',
      summary: customContent.slice(0, 100) + '...',
      content: customContent,
      paragraphs: paragraphs
    };

    onCustomTextCreate(newReadingText);
    onSelectText(newReadingText);
    setShowCustomModal(false);
    setCustomTitle('');
    setCustomContent('');
    confetti({ particleCount: 40 });
  };

  // Theme styling classes
  const themeClasses = {
    dark: 'bg-slate-900 text-slate-100 border-slate-800',
    oled: 'bg-black text-white border-zinc-900',
    sepia: 'bg-[#f4ecd8] text-[#433422] border-[#e2d5bd]',
    light: 'bg-white text-slate-800 border-slate-200'
  }[theme];

  const cardThemeClasses = {
    dark: 'bg-slate-800/90 text-white border-slate-700',
    oled: 'bg-zinc-900 text-white border-zinc-800',
    sepia: 'bg-[#ebdcb9] text-[#2c1d11] border-[#d8c39b]',
    light: 'bg-slate-50 text-slate-900 border-slate-200'
  }[theme];

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        {/* Book / Story Selector Dropdown */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5">
            {allTexts.map((text) => (
              <button
                key={text.id}
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setIsPlayingAudio(false);
                  setCurrentSentenceIndex(null);
                  setSelectedWord(null);
                  onSelectText(text);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
                  currentText.id === text.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{text.coverEmoji}</span>
                <span className="truncate max-w-[140px] sm:max-w-none">{text.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">{text.level}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCustomModal(true)}
            className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مقال أو كتاب</span>
          </button>
        </div>

        {/* Reader Control Tools */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* TTS Audio Player */}
          <button
            onClick={handleTogglePlayNarration}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-sm ${
              isPlayingAudio 
                ? 'bg-rose-600 text-white animate-pulse' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>إيقاف الصوت</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>استماع للدرس</span>
              </>
            )}
          </button>

          {/* Bilingual Translation Toggle */}
          <button
            onClick={() => setBilingualMode(!bilingualMode)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border ${
              bilingualMode 
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>ترجمة الفقرات</span>
          </button>

          {/* Font Size Adjusters */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              className="p-1 text-slate-300 hover:text-white transition cursor-pointer"
              title="تصغير الخط"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-300">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(32, fontSize + 2))}
              className="p-1 text-slate-300 hover:text-white transition cursor-pointer"
              title="تكبير الخط"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1">
            {(['dark', 'sepia', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-2 py-1 text-[11px] rounded-lg transition capitalize font-medium cursor-pointer ${
                  theme === t ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'dark' ? 'داكن' : t === 'sepia' ? 'مريح' : 'فاتح'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Reader Paper */}
      <div 
        ref={readerContainerRef}
        className={`relative border rounded-3xl p-6 sm:p-10 shadow-2xl transition-colors duration-300 ${themeClasses}`}
      >
        {/* Story Header */}
        <div className="border-b pb-6 mb-8 border-current/10">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{currentText.coverEmoji}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold">
                المستوى: {currentText.level}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {currentText.category}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              وقت القراءة: ~{currentText.readTimeMinutes} دقيقة • {currentText.wordCount} كلمة
            </div>
          </div>

          <h1 
            className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 font-display dir-ltr text-left"
          >
            {currentText.title}
          </h1>
          {currentText.titleArabic && (
            <p className="text-sm sm:text-base text-slate-400 font-medium">
              {currentText.titleArabic}
            </p>
          )}
        </div>

        {/* Tip for User */}
        <div className="mb-6 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>
              💡 <strong>نصيحة:</strong> انقر على أي كلمة باللغة الإنجليزية لعرض ترجمتها الفورية ونطقها وحفظها في بطاقات المراجعة (Flashcards).
            </span>
          </div>
        </div>

        {/* Interactive Paragraphs */}
        <div className="space-y-8 dir-ltr text-left">
          {currentText.paragraphs.map((paragraph, pIndex) => {
            const isCurrentlyNarrated = isPlayingAudio && currentSentenceIndex === pIndex;

            // Split into interactive words
            const words = paragraph.text.split(/(\s+)/);

            return (
              <div 
                key={paragraph.id}
                className={`transition-all duration-200 rounded-2xl p-4 ${
                  isCurrentlyNarrated 
                    ? 'bg-indigo-500/15 ring-2 ring-indigo-500/40' 
                    : 'hover:bg-black/5'
                }`}
              >
                <p 
                  style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
                  className="leading-relaxed select-text"
                >
                  {words.map((word, wIdx) => {
                    const clean = cleanWordString(word);
                    const isSaved = isWordSaved(word);
                    const isSpace = /^\s+$/.test(word);

                    if (isSpace) {
                      return <span key={wIdx}>{word}</span>;
                    }

                    return (
                      <span
                        key={wIdx}
                        onClick={(e) => handleWordClick(word, paragraph.text, e)}
                        className={`inline-block cursor-pointer px-1 py-0.5 rounded transition duration-150 relative group ${
                          isSaved 
                            ? 'underline decoration-amber-400 decoration-2 font-semibold text-amber-300' 
                            : 'hover:bg-indigo-500/20 hover:text-indigo-300'
                        }`}
                      >
                        {word}
                      </span>
                    );
                  })}
                </p>

                {/* Bilingual Arabic Translation Below Paragraph */}
                {bilingualMode && paragraph.translationArabic && (
                  <div className="mt-3 pt-3 border-t border-current/10 dir-rtl text-right text-sm text-slate-400 leading-relaxed font-sans">
                    {paragraph.translationArabic}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Word Definition Card (Popup) */}
        {popupPosition && (
          <div 
            style={{ 
              top: `${popupPosition.y}px`, 
              left: `${popupPosition.x}px`,
              maxWidth: '340px'
            }}
            className={`absolute z-40 w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-scaleUp dir-rtl text-right ${cardThemeClasses}`}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setSelectedWord(null);
                setPopupPosition(null);
              }}
              className="absolute top-3 left-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {isLoadingWord ? (
              <div className="py-6 text-center">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-xs text-slate-400">جارٍ جلب الترجمة والمعنى...</span>
              </div>
            ) : selectedWord ? (
              <div className="space-y-3">
                {/* Word & Audio */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold font-display dir-ltr text-left text-indigo-400">
                      {selectedWord.cleanWord}
                    </h3>
                    {selectedWord.phonetic && (
                      <span className="text-xs font-mono text-slate-400 dir-ltr block text-left">
                        {selectedWord.phonetic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => playPronunciation(selectedWord.cleanWord)}
                      className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition cursor-pointer"
                      title="استماع للنطق"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (isWordSaved(selectedWord.cleanWord)) {
                          onRemoveSavedWord(selectedWord.cleanWord);
                        } else {
                          onSaveWord(selectedWord, currentText.title);
                          confetti({ particleCount: 25 });
                        }
                      }}
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        isWordSaved(selectedWord.cleanWord)
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600'
                      }`}
                      title={isWordSaved(selectedWord.cleanWord) ? 'محفوظة في البطاقات' : 'حفظ الكلمة للمراجعة'}
                    >
                      {isWordSaved(selectedWord.cleanWord) ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Arabic Translation Highlight */}
                <div className="p-2.5 rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-200 font-bold text-sm leading-snug">
                  {selectedWord.arabicTranslation}
                </div>

                {/* English Definition */}
                {selectedWord.englishDefinition && (
                  <p className="text-xs text-slate-300 dir-ltr text-left leading-relaxed">
                    {selectedWord.englishDefinition}
                  </p>
                )}

                {/* Context Example */}
                {selectedWord.exampleSentence && (
                  <div className="text-[11px] p-2 rounded-lg bg-black/20 text-slate-300 dir-ltr text-left italic border-l-2 border-indigo-400">
                    "{selectedWord.exampleSentence}"
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Modal to Add Custom Text / Story */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>إضافة نص أو مقال للقراءة التفاعلية</span>
              </h3>
              <button 
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomText} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">عنوان المقال أو القصة</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="مثال: Chapter 1 - A Journey to the Mountains"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">المستوى التقريبي</label>
                <select
                  value={customLevel}
                  onChange={(e: any) => setCustomLevel(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="A1">A1 - مبتدئ جداً</option>
                  <option value="A2">A2 - أساسي</option>
                  <option value="B1">B1 - متوسط</option>
                  <option value="B2">B2 - فوق المتوسط</option>
                  <option value="C1">C1 - متقدم</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">نص المقال (باللغة الإنجليزية)</label>
                <textarea
                  required
                  rows={6}
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="الصق هنا النص أو فقرات المقال الذي تريد قراءته وترجمته كلمة بكلمة..."
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow"
                >
                  حفظ والبدء في القراءة الآن
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
