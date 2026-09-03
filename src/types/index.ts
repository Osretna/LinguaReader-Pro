export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ContentCategory = 
  | 'book' 
  | 'news' 
  | 'story' 
  | 'custom'
  | 'daily'
  | 'work'
  | 'it'
  | 'insurance'
  | 'home'
  | 'parenting'
  | 'mosque';

export interface ContentItem {
  id: string;
  title: string;
  author: string;
  language: string; // e.g., 'en', 'es', 'fr', 'de'
  level: CEFRLevel;
  category: ContentCategory;
  coverImage?: string;
  description: string;
  estimatedMinutes: number;
  wordCount: number;
  text: string;
  source?: string;
  dateAdded?: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  translation: string;
  phonetic?: string;
  partOfSpeech?: string;
  level?: CEFRLevel;
  exampleSentence?: string;
  exampleTranslation?: string;
  sourceTextTitle?: string;
  language: string; // target language
  nativeLanguage: string; // user language
  notes?: string;
  
  // SRS SM-2 Fields
  repetition: number;
  interval: number; // in days
  easeFactor: number; // default 2.5
  nextReviewDate: string; // ISO string
  history: Array<{
    date: string;
    grade: number; // 0 to 5
  }>;
}

export interface UserStats {
  streakDays: number;
  lastActiveDate: string;
  totalWordsLearned: number;
  totalReadingMinutes: number;
  completedTexts: string[]; // text IDs
  weeklyActivity: {
    day: string; // 'Sun', 'Mon', etc.
    minutes: number;
    words: number;
  }[];
  points: number;
  badges: Badge[];
  assessedLevel?: CEFRLevel;
  assessmentScore?: number;
  lastAssessmentDate?: string;
}

export interface VoiceAssessmentResult {
  cefrLevel: CEFRLevel;
  totalScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  pronunciationScore: number;
  feedbackAr: string;
  feedbackEn: string;
  recommendedCategories: ContentCategory[];
  date: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type ReaderFont = 'serif' | 'sans' | 'cairo';
export type ReaderMode = 'learn' | 'reading';

export interface ReaderSettings {
  theme: ReaderTheme;
  font: ReaderFont;
  fontSize: number; // px, e.g. 18
  lineHeight: number;
  mode: ReaderMode;
  autoSpeakOnTap: boolean;
  targetLanguage: string;
  nativeLanguage: string;
  speechRate: number;
}

export type UserRole = 'admin' | 'user';

export type SubscriptionPlan = 'trial' | 'monthly' | 'custom' | 'lifetime';

export interface UserSubscription {
  status: 'trial' | 'active' | 'lifetime' | 'expired';
  plan: SubscriptionPlan;
  planNameAr: string;
  planNameEn: string;
  startedAt: string;
  expiresAt: string | null; // ISO date string or null for lifetime
  trialSecondsTotal: number; // 300 seconds (5 minutes)
  trialSecondsRemaining: number;
  isExpired: boolean;
  activationCodeUsed?: string;
  notes?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  subscription: UserSubscription;
}

export interface LicenseKey {
  code: string;
  plan: SubscriptionPlan;
  durationDays?: number; // e.g. 30 days for monthly
  isUsed: boolean;
  usedByEmail?: string;
  usedAt?: string;
  createdAt: string;
  createdBy: string;
}
