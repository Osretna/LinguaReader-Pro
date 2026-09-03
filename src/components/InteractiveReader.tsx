import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowRight,
  Volume2, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  Settings2, 
  Play, 
  Square, 
  Eye, 
  BookOpen, 
  CheckCircle2, 
  Loader2,
  Maximize2,
  Minimize2,
  Type,
  X,
  Languages,
  Copy,
  Check
} from 'lucide-react';
import { ContentItem, ReaderSettings, VocabularyWord } from '../types';
import { lookupWord, analyzeSentence, translateParagraph, WordAnalysis, SentenceAnalysis } from '../services/dictionary';
import { TTSService } from '../services/tts';
import { StorageService } from '../services/storage';
import confetti from 'canvas-confetti';

interface InteractiveReaderProps {
  item: ContentItem;
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  onBackToLibrary: () => void;
  isArabic: boolean;
}

export const InteractiveReader: React.FC<InteractiveReaderProps> = ({
  item,
  settings,
  onUpdateSettings,
  onBackToLibrary,
  isArabic,
}) => {
  // Word popup state
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordContext, setSelectedWordContext] = useState<string>('');
  const [selectedWordParaIndex, setSelectedWordParaIndex] = useState<number | null>(null);
  const [wordAnalysis, setWordAnalysis] = useState<WordAnalysis | null>(null);
  const [loadingWord, setLoadingWord] = useState<boolean>(false);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);

  // Paragraph translation state
  const [translatedParagraphs, setTranslatedParagraphs] = useState<Record<number, string>>({});
  const [loadingParagraphs, setLoadingParagraphs] = useState<Record<number, boolean>>({});
  const [showAllTranslations, setShowAllTranslations] = useState<boolean>(false);
  const [copiedParagraphIndex, setCopiedParagraphIndex] = useState<number | null>(null);

  // Sentence modal state
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [sentenceAnalysis, setSentenceAnalysis] = useState<SentenceAnalysis | null>(null);
  const [loadingSentence, setLoadingSentence] = useState<boolean>(false);

  // Audio / TTS state
  const [isPlayingFullAudio, setIsPlayingFullAudio] = useState<boolean>(false);
  const [currentSpokenIndex, setCurrentSpokenIndex] = useState<number>(-1);

  // Reader UI settings
  const [showReaderControls, setShowReaderControls] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [readingFinished, setReadingFinished] = useState<boolean>(false);

  // Saved vocabulary lookup map for quick indicator
  const [savedWordsMap, setSavedWordsMap] = useState<Map<string, VocabularyWord>>(new Map());

  // Reading time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      StorageService.recordReadingTime(1);
    }, 60000); // every minute

    return () => clearInterval(timer);
  }, [item.id]);

  // Load user vocabulary map
  useEffect(() => {
    refreshVocabularyMap();
  }, [item.language]);

  const refreshVocabularyMap = () => {
    const words = StorageService.getVocabulary();
    const map = new Map<string, VocabularyWord>();
    words.forEach((w) => {
      map.set(w.word.toLowerCase(), w);
    });
    setSavedWordsMap(map);
  };

  // Split text into paragraphs and sentences
  const paragraphs = useMemo(() => {
    return item.text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  }, [item.text]);

  // Flattened list of sentences for audio narration
  const allSentences = useMemo(() => {
    const list: string[] = [];
    paragraphs.forEach((p) => {
      const sents = p.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [p];
      sents.forEach((s) => {
        const trimmed = s.trim();
        if (trimmed) list.push(trimmed);
      });
    });
    return list;
  }, [paragraphs]);

  // Unknown words statistics
  const comprehensionStats = useMemo(() => {
    const words = (item.text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || []) as string[];
    const totalWords = words.length;
    if (totalWords === 0) return { percent: 100, unknownCount: 0 };

    let unknown = 0;
    words.forEach((w) => {
      if (w.length > 3 && !savedWordsMap.has(w)) {
        unknown++;
      }
    });

    const knownRatio = Math.max(70, Math.min(99, Math.round(((totalWords - unknown * 0.4) / totalWords) * 100)));
    return { percent: knownRatio, unknownCount: Math.round(unknown * 0.3) };
  }, [item.text, savedWordsMap]);

  // Handle word click
  const handleWordClick = async (rawWord: string, sentence: string, pIdx: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const clean = rawWord.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!clean) return;

    setSelectedWord(clean);
    setSelectedWordContext(sentence);
    setSelectedWordParaIndex(pIdx);
    setLoadingWord(true);

    // Calculate popup position
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupPos({
      x: Math.min(window.innerWidth - 320, Math.max(16, rect.left + rect.width / 2 - 150)),
      y: rect.bottom + window.scrollY + 8,
    });

    if (settings.autoSpeakOnTap) {
      TTSService.speak({
        text: clean,
        lang: item.language,
        rate: settings.speechRate,
      });
    }

    try {
      const result = await lookupWord(clean, item.language, settings.nativeLanguage, sentence);
      setWordAnalysis(result);
    } catch (err) {
      console.error('Error fetching word analysis', err);
    } finally {
      setLoadingWord(false);
    }
  };

  // Handle paragraph translation toggle
  const handleToggleParagraphTranslation = async (pIdx: number, paraText: string) => {
    if (translatedParagraphs[pIdx]) {
      setTranslatedParagraphs((prev) => {
        const next = { ...prev };
        delete next[pIdx];
        return next;
      });
      return;
    }

    setLoadingParagraphs((prev) => ({ ...prev, [pIdx]: true }));
    try {
      const translation = await translateParagraph(paraText, item.language, settings.nativeLanguage);
      setTranslatedParagraphs((prev) => ({ ...prev, [pIdx]: translation }));
    } catch (err) {
      console.error('Error translating paragraph', err);
    } finally {
      setLoadingParagraphs((prev) => ({ ...prev, [pIdx]: false }));
    }
  };

  // Toggle all paragraph translations (Bilingual reading mode)
  const handleToggleAllParagraphs = async () => {
    if (showAllTranslations) {
      setShowAllTranslations(false);
      setTranslatedParagraphs({});
      return;
    }

    setShowAllTranslations(true);
    const newTranslations: Record<number, string> = {};
    const promises = paragraphs.map(async (p, idx) => {
      if (translatedParagraphs[idx]) {
        newTranslations[idx] = translatedParagraphs[idx];
      } else {
        setLoadingParagraphs((prev) => ({ ...prev, [idx]: true }));
        try {
          const trans = await translateParagraph(p, item.language, settings.nativeLanguage);
          newTranslations[idx] = trans;
        } catch (e) {
          // ignore
        } finally {
          setLoadingParagraphs((prev) => ({ ...prev, [idx]: false }));
        }
      }
    });

    await Promise.all(promises);
    setTranslatedParagraphs((prev) => ({ ...prev, ...newTranslations }));
  };

  // Handle sentence long press / click button
  const handleSentenceInspect = async (sentence: string) => {
    setSelectedSentence(sentence);
    setLoadingSentence(true);
    try {
      const res = await analyzeSentence(sentence, item.language, settings.nativeLanguage);
      setSentenceAnalysis(res);
    } catch (err) {
      console.error('Error analyzing sentence', err);
    } finally {
      setLoadingSentence(false);
    }
  };

  // Add / remove word in SRS vocabulary
  const toggleSaveWord = (analysis: WordAnalysis) => {
    const isSaved = savedWordsMap.has(analysis.word.toLowerCase());
    if (isSaved) {
      const existing = savedWordsMap.get(analysis.word.toLowerCase());
      if (existing) {
        StorageService.removeWord(existing.id);
      }
    } else {
      StorageService.saveWord({
        word: analysis.word,
        translation: analysis.translation,
        phonetic: analysis.phonetic,
        partOfSpeech: analysis.partOfSpeech,
        level: analysis.level,
        exampleSentence: analysis.exampleSentence || selectedWordContext,
        exampleTranslation: analysis.exampleTranslation,
        sourceTextTitle: item.title,
        language: item.language,
        nativeLanguage: settings.nativeLanguage,
      });
    }
    refreshVocabularyMap();
  };

  // Full Audio Player
  const startFullAudio = () => {
    if (isPlayingFullAudio) {
      TTSService.stop();
      setIsPlayingFullAudio(false);
      setCurrentSpokenIndex(-1);
      return;
    }

    setIsPlayingFullAudio(true);
    playSentenceAtIndex(0);
  };

  const playSentenceAtIndex = (index: number) => {
    if (index >= allSentences.length) {
      setIsPlayingFullAudio(false);
      setCurrentSpokenIndex(-1);
      return;
    }

    setCurrentSpokenIndex(index);
    const textToSpeak = allSentences[index];

    TTSService.speak({
      text: textToSpeak,
      lang: item.language,
      rate: settings.speechRate,
      onEnd: () => {
        playSentenceAtIndex(index + 1);
      },
      onError: () => {
        setIsPlayingFullAudio(false);
      },
    });
  };

  const stopFullAudio = () => {
    TTSService.stop();
    setIsPlayingFullAudio(false);
    setCurrentSpokenIndex(-1);
  };

  // Mark text completed & celebrate
  const handleFinishReading = () => {
    setReadingFinished(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Close popups on click outside
  useEffect(() => {
    const handleDocumentClick = () => {
      setSelectedWord(null);
      setWordAnalysis(null);
      setPopupPos(null);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Theme styling
  const themeClasses = {
    light: 'bg-white text-slate-900 border-slate-200',
    sepia: 'bg-[#fbf7ee] text-[#433422] border-[#e9dfcb]',
    dark: 'bg-[#121826] text-slate-100 border-slate-800',
  }[settings.theme];

  const fontClasses = {
    serif: 'font-serif',
    sans: 'font-sans',
    cairo: 'font-sans font-medium',
  }[settings.font];

  return (
    <div 
      id="interactive-reader-container" 
      className={`min-h-[calc(100vh-4rem)] transition-colors duration-200 ${
        settings.theme === 'dark' ? 'bg-[#0b0f19]' : settings.theme === 'sepia' ? 'bg-[#f4eedf]' : 'bg-slate-100/70'
      } py-6 px-3 sm:px-6`}
    >
      <div className="max-w-4xl mx-auto">
        
        {/* Top Sticky Reader Header / Toolbar */}
        <div className={`rounded-2xl border shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-3 ${themeClasses}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="back-to-library-btn"
              onClick={onBackToLibrary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200/50 transition cursor-pointer"
            >
              {isArabic ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isArabic ? 'المكتبة' : 'Library'}</span>
            </button>

            <div className="hidden sm:flex flex-col">
              <h1 className="text-sm font-bold truncate max-w-[200px] md:max-w-xs">{item.title}</h1>
              <span className="text-[11px] opacity-70">{item.author} • {item.level}</span>
            </div>
          </div>

          {/* Center: Audio playback & Comprehension Meter */}
          <div className="flex items-center gap-2">
            
            {/* Audio narration button */}
            <button
              id="full-audio-toggle-btn"
              onClick={startFullAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                isPlayingFullAudio
                  ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              title={isPlayingFullAudio ? 'إيقاف النطق' : 'استمع للنص كاملاً'}
            >
              {isPlayingFullAudio ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>{isPlayingFullAudio ? (isArabic ? 'إيقاف' : 'Stop') : (isArabic ? 'استماع للنص' : 'Listen')}</span>
            </button>

            {/* Comprehension Badge */}
            <div 
              id="comprehension-score-badge"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
              title={`فهم مقدر بنسبة ${comprehensionStats.percent}% بناءً على قاموسك ومستوى النص`}
            >
              <span>{comprehensionStats.percent}% {isArabic ? 'فهم مقدّر' : 'Comprehension'}</span>
            </div>
          </div>

          {/* Right: Mode & Formatting Controls */}
          <div className="flex items-center gap-1.5">
            {/* Bilingual / Translate All Paragraphs Toggle */}
            <button
              id="bilingual-paragraphs-toggle-btn"
              onClick={handleToggleAllParagraphs}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                showAllTranslations
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
              title={isArabic ? 'ترجمة كل فقرات النص بالعربية' : 'Translate all paragraphs to Arabic'}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {showAllTranslations ? (isArabic ? 'إخفاء ترجمات الفقرات' : 'Hide Paragraphs') : (isArabic ? 'ترجمة كل الفقرات' : 'Translate Paragraphs')}
              </span>
            </button>

            {/* Reading Mode vs Learning Mode Toggle */}
            <button
              id="reader-mode-toggle-btn"
              onClick={() => onUpdateSettings({ mode: settings.mode === 'learn' ? 'reading' : 'learn' })}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                settings.mode === 'reading'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
              title={settings.mode === 'reading' ? 'وضع القراءة: الترجمة فوق الكلمات الصعبة' : 'وضع التعلم: الترجمة عند النقر'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {settings.mode === 'reading' ? (isArabic ? 'وضع القراءة' : 'Reading Mode') : (isArabic ? 'وضع التعلم' : 'Learn Mode')}
              </span>
            </button>

            {/* Typography & Theme popover trigger */}
            <button
              id="reader-settings-toggle-btn"
              onClick={() => setShowReaderControls(!showReaderControls)}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 transition cursor-pointer relative"
              title="تخصيص الخط والخلفية"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Zen Mode */}
            <button
              id="zen-mode-toggle-btn"
              onClick={() => setIsZenMode(!isZenMode)}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
              title={isZenMode ? 'خروج من وضع التركيز' : 'وضع التركيز (Zen Mode)'}
            >
              {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Reader Customization Dropdown Panel */}
        {showReaderControls && (
          <div 
            id="reader-formatting-panel"
            className={`rounded-2xl border shadow-lg p-5 mb-6 animate-in slide-in-from-top-2 ${themeClasses}`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                {isArabic ? 'إعدادات القراءة والخط' : 'Reading Preferences'}
              </span>
              <button onClick={() => setShowReaderControls(false)} className="opacity-50 hover:opacity-100 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              {/* Color Themes */}
              <div>
                <label className="font-semibold block mb-2">{isArabic ? 'سمة الخلفية:' : 'Background Theme:'}</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateSettings({ theme: 'light' })}
                    className={`flex-1 py-2 rounded-xl border text-center font-bold transition ${
                      settings.theme === 'light' ? 'ring-2 ring-indigo-600 border-indigo-600 bg-white text-slate-900' : 'bg-white text-slate-800'
                    }`}
                  >
                    {isArabic ? 'نهاري' : 'Light'}
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ theme: 'sepia' })}
                    className={`flex-1 py-2 rounded-xl border text-center font-bold transition ${
                      settings.theme === 'sepia' ? 'ring-2 ring-amber-600 border-amber-600 bg-[#fbf7ee] text-[#433422]' : 'bg-[#fbf7ee] text-[#433422]'
                    }`}
                  >
                    {isArabic ? 'ورق كتبي' : 'Sepia'}
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ theme: 'dark' })}
                    className={`flex-1 py-2 rounded-xl border text-center font-bold transition ${
                      settings.theme === 'dark' ? 'ring-2 ring-indigo-400 border-indigo-400 bg-[#121826] text-white' : 'bg-[#121826] text-white'
                    }`}
                  >
                    {isArabic ? 'ليلي' : 'Dark'}
                  </button>
                </div>
              </div>

              {/* Font Family */}
              <div>
                <label className="font-semibold block mb-2">{isArabic ? 'نوع الخط:' : 'Font Style:'}</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateSettings({ font: 'serif' })}
                    className={`flex-1 py-2 rounded-xl border text-center font-serif text-sm transition ${
                      settings.font === 'serif' ? 'ring-2 ring-indigo-600 font-bold' : ''
                    }`}
                  >
                    Serif
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ font: 'sans' })}
                    className={`flex-1 py-2 rounded-xl border text-center font-sans text-sm transition ${
                      settings.font === 'sans' ? 'ring-2 ring-indigo-600 font-bold' : ''
                    }`}
                  >
                    Sans
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ font: 'cairo' })}
                    className={`flex-1 py-2 rounded-xl border text-center font-sans font-bold text-sm transition ${
                      settings.font === 'cairo' ? 'ring-2 ring-indigo-600 font-bold' : ''
                    }`}
                  >
                    Cairo
                  </button>
                </div>
              </div>

              {/* Font Size Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold">{isArabic ? 'حجم الخط:' : 'Font Size:'}</label>
                  <span className="font-mono">{settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="28"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* The Main Reading Canvas */}
        <article 
          id="reader-main-canvas"
          className={`rounded-3xl border shadow-sm p-6 sm:p-12 transition-all duration-200 ${themeClasses} ${fontClasses}`}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            maxWidth: isZenMode ? '100%' : '52rem',
            margin: '0 auto',
          }}
          dir="ltr"
        >
          {/* Article / Book Cover & Title Header */}
          <div className="border-b border-slate-200/60 dark:border-slate-800 pb-8 mb-8 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 mb-3">
              {item.category.toUpperCase()} • LEVEL {item.level}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              {item.title}
            </h1>
            <p className="text-sm opacity-70">
              By <span className="font-semibold">{item.author}</span> • ~{item.estimatedMinutes} min read ({item.wordCount} words)
            </p>
          </div>

          {/* Text Flow with Clickable Words, Sentences, and Paragraph Translation */}
          <div className="space-y-8 text-justify selection:bg-indigo-500 selection:text-white">
            {paragraphs.map((para, pIdx) => {
              // Extract sentences from paragraph
              const sentences = para.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [para];
              const isParaTranslated = Boolean(translatedParagraphs[pIdx]);
              const isParaLoading = Boolean(loadingParagraphs[pIdx]);

              return (
                <div 
                  key={pIdx} 
                  className="group/para rounded-2xl transition-all duration-200"
                >
                  {/* Paragraph Toolbar Header */}
                  <div className="flex items-center justify-between mb-2 text-xs opacity-70 group-hover/para:opacity-100 transition">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800 text-slate-500">
                        § {pIdx + 1}
                      </span>
                      <button
                        onClick={() => handleToggleParagraphTranslation(pIdx, para)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          isParaTranslated
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                        }`}
                        title={isArabic ? 'ترجمة هذه الفقرة إلى العربية' : 'Translate paragraph to Arabic'}
                      >
                        {isParaLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Languages className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isParaLoading
                            ? (isArabic ? 'جاري الترجمة...' : 'Translating...')
                            : isParaTranslated
                            ? (isArabic ? 'إخفاء ترجمة الفقرة' : 'Hide Translation')
                            : (isArabic ? 'ترجمة الفقرة بالعربية' : 'Translate Paragraph')}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => TTSService.speak({ text: para, lang: item.language, rate: settings.speechRate })}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                        title={isArabic ? 'استمع لنطق الفقرة' : 'Pronounce paragraph'}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Foreign Language Paragraph */}
                  <p className="leading-relaxed relative">
                    {sentences.map((sent, sIdx) => {
                      // Match words and delimiters
                      const tokens = sent.split(/(\s+|[.,!?:;"'«»—–\(\)\[\]]+)/);
                      const globalSentenceIndex = allSentences.indexOf(sent.trim());
                      const isSpokenSentence = isPlayingFullAudio && currentSpokenIndex === globalSentenceIndex;

                      return (
                        <span 
                          key={sIdx} 
                          className={`transition-colors duration-150 rounded px-0.5 ${
                            isSpokenSentence ? 'bg-amber-200 dark:bg-amber-900/60 text-slate-900 dark:text-white font-medium' : ''
                          }`}
                        >
                          {tokens.map((token, tIdx) => {
                            const isWord = /[\p{L}\p{N}]+/u.test(token);
                            if (!isWord) {
                              return <span key={tIdx}>{token}</span>;
                            }

                            const cleanWord = token.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
                            const isSaved = savedWordsMap.has(cleanWord);
                            const isDifficult = cleanWord.length >= 8;

                            return (
                              <span
                                key={tIdx}
                                onClick={(e) => handleWordClick(token, sent, pIdx, e)}
                                className={`cursor-pointer inline-block transition-colors rounded-sm px-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-300 relative ${
                                  isSaved
                                    ? 'border-b-2 border-indigo-500 font-medium'
                                    : isDifficult && settings.mode === 'reading'
                                    ? 'border-b border-dashed border-amber-500'
                                    : ''
                                }`}
                                title={isArabic ? 'انقر للترجمة والنطق الفوري' : 'Click to translate and speak'}
                              >
                                {/* Reading Mode Auto-Gloss for Difficult Words */}
                                {settings.mode === 'reading' && isDifficult && (
                                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-sans font-medium text-indigo-500 pointer-events-none opacity-80 whitespace-nowrap">
                                    {cleanWord.length > 9 ? '★' : '•'}
                                  </span>
                                )}
                                {token}
                              </span>
                            );
                          })}

                          {/* Sentence Inspector Icon Button */}
                          <button
                            onClick={() => handleSentenceInspect(sent.trim())}
                            className="inline-flex items-center justify-center opacity-0 group-hover/para:opacity-100 hover:opacity-100 text-slate-400 hover:text-indigo-600 transition mx-1 p-0.5 rounded cursor-pointer align-middle"
                            title={isArabic ? 'ترجمة وتحليل الجملة بالكامل' : 'Translate and analyze entire sentence'}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </p>

                  {/* Arabic Translation for Paragraph */}
                  {isParaTranslated && (
                    <div 
                      className="mt-3.5 p-4 sm:p-5 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 shadow-xs text-slate-900 dark:text-slate-100 animate-in fade-in slide-in-from-top-2"
                      dir="rtl"
                    >
                      <div className="flex items-center justify-between mb-2 text-xs font-bold text-indigo-900 dark:text-indigo-300 border-b border-indigo-200/60 dark:border-indigo-900/60 pb-2">
                        <span className="flex items-center gap-1.5">
                          <Languages className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          {isArabic ? 'الترجمة العربية للفقرة' : 'Arabic Paragraph Translation'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => TTSService.speak({ text: translatedParagraphs[pIdx], lang: 'ar' })}
                            className="p-1 rounded-lg text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
                            title={isArabic ? 'استمع للترجمة العربية' : 'Listen in Arabic'}
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(translatedParagraphs[pIdx]);
                              setCopiedParagraphIndex(pIdx);
                              setTimeout(() => setCopiedParagraphIndex(null), 2000);
                            }}
                            className="p-1 rounded-lg text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
                            title={isArabic ? 'نسخ الترجمة' : 'Copy translation'}
                          >
                            {copiedParagraphIndex === pIdx ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleParagraphTranslation(pIdx, para)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                            title={isArabic ? 'إخفاء' : 'Hide'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="font-sans leading-relaxed text-sm sm:text-base text-slate-800 dark:text-slate-100">
                        {translatedParagraphs[pIdx]}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reading Completed Section */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 dark:border-slate-800 text-center">
            {readingFinished ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 animate-in zoom-in-95">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-base font-bold">
                  {isArabic ? 'أحسنت! أتممت قراءة هذا النص بنجاح 🎉' : 'Well done! Reading completed successfully 🎉'}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  {isArabic 
                    ? 'تم تسجيل دقائق القراءة وإضافة نقاط الخبرة إلى لوحة تحكمك.'
                    : 'Reading minutes and streak points have been added to your dashboard.'}
                </p>
                <button
                  onClick={onBackToLibrary}
                  className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                >
                  {isArabic ? 'العودة للمكتبة وقراءة نص آخر' : 'Explore more texts'}
                </button>
              </div>
            ) : (
              <button
                id="finish-reading-btn"
                onClick={handleFinishReading}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-indigo-500/20 transition cursor-pointer inline-flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isArabic ? 'أنهيت القراءة — إضافة للنقاط' : 'Mark as Completed'}</span>
              </button>
            )}
          </div>
        </article>

        {/* 1. Floating Click-to-Translate Word Popup Card */}
        {selectedWord && popupPos && (
          <div
            id="word-translate-popup"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: `${popupPos.y}px`,
              left: `${popupPos.x}px`,
              zIndex: 60,
              width: '320px',
            }}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {loadingWord ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>{isArabic ? 'جاري استدعاء المعنى الذكي...' : 'Looking up word...'}</span>
              </div>
            ) : wordAnalysis ? (
              <div className="space-y-3">
                {/* Header: Word + Audio + Level */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex flex-col" dir="ltr">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                        {wordAnalysis.word}
                      </h3>
                      <button
                        onClick={() =>
                          TTSService.speak({
                            text: wordAnalysis.word,
                            lang: item.language,
                            rate: settings.speechRate,
                          })
                        }
                        className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title={isArabic ? 'استمع للنطق' : 'Pronounce'}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    {wordAnalysis.phonetic && (
                      <span className="text-xs text-slate-400 font-mono">{wordAnalysis.phonetic}</span>
                    )}
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    wordAnalysis.level === 'A1' || wordAnalysis.level === 'A2'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : wordAnalysis.level === 'B1' || wordAnalysis.level === 'B2'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {wordAnalysis.level}
                  </span>
                </div>

                {/* Primary Arabic Translation */}
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5" />
                      {isArabic ? 'الترجمة بالعربية:' : 'Arabic Translation:'}
                    </span>
                    <button
                      onClick={() => TTSService.speak({ text: wordAnalysis.translation, lang: 'ar' })}
                      className="p-0.5 rounded text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 transition"
                      title={isArabic ? 'استمع للترجمة العربية' : 'Listen in Arabic'}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                    {wordAnalysis.translation}
                  </p>
                  {wordAnalysis.partOfSpeech && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 inline-block">
                      {wordAnalysis.partOfSpeech}
                    </span>
                  )}
                  {wordAnalysis.synonyms && wordAnalysis.synonyms.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-indigo-100 dark:border-indigo-900/60 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-500">{isArabic ? 'معانٍ أخرى: ' : 'Also: '}</span>
                      <span>{wordAnalysis.synonyms.slice(0, 3).join('، ')}</span>
                    </div>
                  )}
                </div>

                {/* Translate full paragraph shortcut */}
                {selectedWordParaIndex !== null && (
                  <button
                    onClick={() => {
                      if (selectedWordParaIndex !== null && paragraphs[selectedWordParaIndex]) {
                        handleToggleParagraphTranslation(selectedWordParaIndex, paragraphs[selectedWordParaIndex]);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800/70 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-indigo-200"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>
                      {translatedParagraphs[selectedWordParaIndex]
                        ? (isArabic ? 'إخفاء ترجمة الفقرة' : 'Hide Paragraph')
                        : (isArabic ? 'ترجمة كامل الفقرة بالعربية' : 'Translate Entire Paragraph')}
                    </span>
                  </button>
                )}

                {/* Example sentence */}
                {wordAnalysis.exampleSentence && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 border-s-2 border-indigo-500 ps-2.5">
                    <p dir="ltr" className="font-serif italic text-slate-800 dark:text-slate-200">
                      "{wordAnalysis.exampleSentence}"
                    </p>
                    {wordAnalysis.exampleTranslation && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {wordAnalysis.exampleTranslation}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons: Add to SRS & Close */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => toggleSaveWord(wordAnalysis)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      savedWordsMap.has(wordAnalysis.word.toLowerCase())
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    {savedWordsMap.has(wordAnalysis.word.toLowerCase()) ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isArabic ? 'في قاموسك (SRS)' : 'Saved in SRS'}</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'حفظ في قاموسي' : 'Save to SRS'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedWord(null);
                      setPopupPos(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg"
                  >
                    {isArabic ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* 2. Full Sentence Analysis Modal */}
        {selectedSentence && (
          <div 
            id="sentence-inspector-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
            onClick={() => setSelectedSentence(null)}
          >
            <div 
              className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold">
                    {isArabic ? 'التحليل النحوي والسياقي للجملة' : 'Sentence Grammar Analysis'}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedSentence(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Original sentence */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center justify-between mb-1" dir="ltr">
                  <span className="text-xs font-semibold text-slate-400">Original Sentence</span>
                  <button
                    onClick={() => TTSService.speak({ text: selectedSentence, lang: item.language })}
                    className="text-slate-500 hover:text-indigo-600 p-1"
                    title="نطق الجملة"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p dir="ltr" className="font-serif text-base text-slate-900 dark:text-white leading-relaxed">
                  "{selectedSentence}"
                </p>
              </div>

              {loadingSentence ? (
                <div className="flex items-center justify-center py-8 gap-2 text-xs text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>{isArabic ? 'جاري تحليل القواعد والتراكيب بالسياق...' : 'Analyzing syntax and context...'}</span>
                </div>
              ) : sentenceAnalysis ? (
                <div className="space-y-4">
                  {/* Native Translation */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                      {isArabic ? 'الترجمة الكاملة:' : 'Complete Translation:'}
                    </span>
                    <p className="text-base font-semibold text-indigo-950 dark:text-indigo-100">
                      {sentenceAnalysis.translation}
                    </p>
                  </div>

                  {/* Grammar clauses */}
                  {sentenceAnalysis.grammarBreakdown && sentenceAnalysis.grammarBreakdown.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 block">
                        {isArabic ? 'تفكيك القواعد والتراكيب:' : 'Grammatical Breakdown:'}
                      </span>
                      {sentenceAnalysis.grammarBreakdown.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                          <span dir="ltr" className="font-mono font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                            {item.clause}
                          </span>
                          <p className="text-slate-600 dark:text-slate-300">{item.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Level assessment */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <span>
                      {isArabic ? 'مستوى صعوبة الجملة:' : 'Sentence Level:'}{' '}
                      <strong className="text-indigo-600">{sentenceAnalysis.level}</strong>
                    </span>
                    <span>{sentenceAnalysis.difficultyExplanation}</span>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSentence(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold"
                >
                  {isArabic ? 'تم' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
