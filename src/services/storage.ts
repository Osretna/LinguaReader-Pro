import { VocabularyWord, UserStats, ReaderSettings, ContentItem } from '../types';

const STORAGE_KEYS = {
  VOCABULARY: 'lr_vocabulary_v1',
  STATS: 'lr_user_stats_v1',
  SETTINGS: 'lr_reader_settings_v1',
  PROGRESS: 'lr_reading_progress_v1',
  CUSTOM_TEXTS: 'lr_custom_texts_v1',
};

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'light',
  font: 'serif',
  fontSize: 18,
  lineHeight: 1.65,
  mode: 'learn',
  autoSpeakOnTap: true,
  targetLanguage: 'en',
  nativeLanguage: 'ar',
  speechRate: 1.0,
};

export const DEFAULT_STATS: UserStats = {
  streakDays: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  totalWordsLearned: 18,
  totalReadingMinutes: 45,
  completedTexts: ['book-1'],
  weeklyActivity: [
    { day: 'السبت', minutes: 15, words: 6 },
    { day: 'الأحد', minutes: 20, words: 8 },
    { day: 'الإثنين', minutes: 10, words: 4 },
    { day: 'الثلاثاء', minutes: 25, words: 12 },
    { day: 'الأربعاء', minutes: 18, words: 7 },
    { day: 'الخميس', minutes: 0, words: 0 },
    { day: 'الجمعة', minutes: 0, words: 0 },
  ],
  points: 320,
  badges: [
    {
      id: 'first_word',
      title: 'الكلمة الأولى',
      description: 'أضفت أول كلمة إلى قاموسك الشخصي',
      icon: '🌱',
      unlocked: true,
      unlockedAt: '2026-08-30',
    },
    {
      id: 'streak_3',
      title: 'شعلة الاستمرار',
      description: 'حافظت على عادة القراءة لمدة 3 أيام متتالية',
      icon: '🔥',
      unlocked: true,
      unlockedAt: '2026-09-01',
    },
    {
      id: 'bookworm',
      title: 'دودة الكتب',
      description: 'أتممت قراءة أول كتاب بالكامل',
      icon: '📖',
      unlocked: true,
      unlockedAt: '2026-09-02',
    },
    {
      id: 'srs_master',
      title: 'سيد الذاكرة (SRS)',
      description: 'راجعت 20 بطاقة تعليمية في جلسة واحدة',
      icon: '🧠',
      unlocked: false,
    },
    {
      id: 'polyglot',
      title: 'متعدد اللغات',
      description: 'قرأت نصوصاً بلغتين مختلفتين',
      icon: '🌍',
      unlocked: false,
    },
  ],
};

const INITIAL_VOCABULARY: VocabularyWord[] = [
  {
    id: 'w-1',
    word: 'prejudice',
    translation: 'حكم مسبق / تعصب',
    phonetic: '/ˈpredʒ.ə.dɪs/',
    partOfSpeech: 'اسم (Noun)',
    level: 'B2',
    exampleSentence: 'We must fight against racial prejudice.',
    exampleTranslation: 'يجب علينا محاربة التعصب العنصري.',
    sourceTextTitle: 'Pride and Prejudice',
    language: 'en',
    nativeLanguage: 'ar',
    repetition: 2,
    interval: 6,
    easeFactor: 2.5,
    nextReviewDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // Due now
    history: [{ date: '2026-08-31', grade: 4 }],
  },
  {
    id: 'w-2',
    word: 'fortune',
    translation: 'ثروة / حظ وافر',
    phonetic: '/ˈfɔːr.tʃuːn/',
    partOfSpeech: 'اسم (Noun)',
    level: 'B1',
    exampleSentence: 'He inherited a substantial fortune from his grandfather.',
    exampleTranslation: 'ورث ثروة طائلة من جده.',
    sourceTextTitle: 'Pride and Prejudice',
    language: 'en',
    nativeLanguage: 'ar',
    repetition: 3,
    interval: 14,
    easeFactor: 2.6,
    nextReviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    history: [{ date: '2026-08-28', grade: 5 }],
  },
  {
    id: 'w-3',
    word: 'invisible',
    translation: 'خفي / غير مرئي',
    phonetic: '/ɪnˈvɪz.ə.bəl/',
    partOfSpeech: 'صفة (Adjective)',
    level: 'B1',
    exampleSentence: 'What is essential is invisible to the eye.',
    exampleTranslation: 'ما هو جوهري لا يمكن رؤيته بالعين المجردة.',
    sourceTextTitle: 'The Little Prince',
    language: 'en',
    nativeLanguage: 'ar',
    repetition: 1,
    interval: 1,
    easeFactor: 2.4,
    nextReviewDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // Due now
    history: [{ date: '2026-09-01', grade: 3 }],
  },
  {
    id: 'w-4',
    word: 'universal',
    translation: 'شامل / عام',
    phonetic: '/ˌjuː.nəˈvɝː.səl/',
    partOfSpeech: 'صفة (Adjective)',
    level: 'B2',
    exampleSentence: 'Music is a universal language.',
    exampleTranslation: 'الموسيقى لغة عالمية.',
    sourceTextTitle: 'Pride and Prejudice',
    language: 'en',
    nativeLanguage: 'ar',
    repetition: 0,
    interval: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // Due now
    history: [],
  },
];

export class StorageService {
  public static getVocabulary(): VocabularyWord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VOCABULARY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(INITIAL_VOCABULARY));
        return INITIAL_VOCABULARY;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_VOCABULARY;
    }
  }

  public static saveWord(wordData: Omit<VocabularyWord, 'id' | 'repetition' | 'interval' | 'easeFactor' | 'nextReviewDate' | 'history'>): VocabularyWord {
    const list = this.getVocabulary();
    const existingIndex = list.findIndex(w => w.word.toLowerCase() === wordData.word.toLowerCase() && w.language === wordData.language);

    if (existingIndex >= 0) {
      // already exists
      return list[existingIndex];
    }

    const newWord: VocabularyWord = {
      ...wordData,
      id: 'w-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
      history: [],
    };

    list.unshift(newWord);
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(list));

    // Update stats
    this.incrementWordsLearned();

    return newWord;
  }

  public static updateWordSRS(updatedWord: VocabularyWord): void {
    const list = this.getVocabulary();
    const index = list.findIndex(w => w.id === updatedWord.id);
    if (index >= 0) {
      list[index] = updatedWord;
      localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(list));
    }
  }

  public static removeWord(wordId: string): void {
    const list = this.getVocabulary().filter(w => w.id !== wordId);
    localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(list));
  }

  public static getSettings(): ReaderSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: Partial<ReaderSettings>): ReaderSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  public static getUserStats(): UserStats {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STATS);
      return stored ? { ...DEFAULT_STATS, ...JSON.parse(stored) } : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  }

  public static saveUserStats(partial: Partial<UserStats>): UserStats {
    const current = this.getUserStats();
    const updated = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(updated));
    return updated;
  }

  public static recordReadingTime(minutes: number): void {
    const stats = this.getUserStats();
    stats.totalReadingMinutes += minutes;
    stats.points += minutes * 5;

    // Check today streak
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (stats.lastActiveDate === yesterday) {
        stats.streakDays += 1;
      } else {
        stats.streakDays = 1;
      }
      stats.lastActiveDate = today;
    }

    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }

  private static incrementWordsLearned(): void {
    const stats = this.getUserStats();
    stats.totalWordsLearned += 1;
    stats.points += 10;
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }

  public static getCustomTexts(): ContentItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEXTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public static saveCustomText(item: ContentItem): void {
    const list = this.getCustomTexts();
    list.unshift(item);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEXTS, JSON.stringify(list));
  }

  public static exportAnkiCSV(): string {
    const words = this.getVocabulary();
    let csv = '#separator:tab\n#html:true\n#tags column:4\n';
    words.forEach(w => {
      const front = `${w.word} <br><small style="color:gray">${w.phonetic || ''}</small>`;
      const back = `<b>${w.translation}</b><br><i>${w.partOfSpeech || ''}</i><br><p>${w.exampleSentence || ''}</p><p style="color:gray">${w.exampleTranslation || ''}</p>`;
      const tags = `LinguaReader ${w.level || ''} ${w.language}`;
      csv += `${front}\t${back}\t\t${tags}\n`;
    });
    return csv;
  }
}
