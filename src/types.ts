export * from './types/index';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isActivated: boolean;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt: string;
  activationDate?: string;
  activatedBy?: string;
  notes?: string;
}

export interface WordDefinition {
  word: string;
  cleanWord: string;
  phonetic?: string;
  partOfSpeech?: string;
  arabicTranslation: string;
  englishDefinition?: string;
  exampleSentence?: string;
  exampleArabic?: string;
  difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  synonyms?: string[];
  audioUrl?: string;
}

export interface SavedWord {
  id: string;
  word: string;
  translation: string;
  contextSentence?: string;
  language: string;
  addedAt: string;
  level: number; // 0-5 for spaced repetition
  nextReviewDate: string;
  lastReviewedDate?: string;
  masteryPercent: number;
}

export interface ReadingText {
  id: string;
  title: string;
  titleArabic?: string;
  language: 'en' | 'fr' | 'de' | 'es' | 'it' | 'ar';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: string;
  readTimeMinutes: number;
  wordCount: number;
  coverEmoji: string;
  summary: string;
  content: string;
  paragraphs: {
    id: number;
    text: string;
    translationArabic?: string;
  }[];
}
