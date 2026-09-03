import { VocabularyWord } from '../types';

/**
 * SuperMemo 2 (SM-2) Spaced Repetition Algorithm
 * Grade scale:
 * 5 - Perfect recall, without hesitation
 * 4 - Correct response after a hesitation
 * 3 - Correct response recalled with serious difficulty
 * 2 - Incorrect response; where the correct one seemed easy to recall
 * 1 - Incorrect response; the correct one remembered
 * 0 - Complete blackout
 */
export function calculateSM2(
  currentWord: VocabularyWord,
  grade: number
): {
  repetition: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string;
} {
  let { repetition, interval, easeFactor } = currentWord;
  
  if (easeFactor === undefined || easeFactor < 1.3) {
    easeFactor = 2.5;
  }
  if (interval === undefined || interval < 1) {
    interval = 1;
  }
  if (repetition === undefined) {
    repetition = 0;
  }

  // Calculate new Ease Factor
  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  );

  let newRepetition = repetition;
  let newInterval = interval;

  if (grade >= 3) {
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
    newRepetition += 1;
  } else {
    newRepetition = 0;
    newInterval = 1;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    repetition: newRepetition,
    interval: newInterval,
    easeFactor: Number(newEaseFactor.toFixed(2)),
    nextReviewDate: nextDate.toISOString(),
  };
}

export function isDueForReview(word: VocabularyWord): boolean {
  if (!word.nextReviewDate) return true;
  const reviewDate = new Date(word.nextReviewDate);
  const now = new Date();
  return reviewDate <= now;
}

export function formatIntervalDisplay(intervalDays: number, isArabic = true): string {
  if (intervalDays <= 1) {
    return isArabic ? 'غداً' : 'Tomorrow';
  }
  if (intervalDays < 7) {
    return isArabic ? `بعد ${intervalDays} أيام` : `In ${intervalDays} days`;
  }
  if (intervalDays < 30) {
    const weeks = Math.round(intervalDays / 7);
    return isArabic ? `بعد ${weeks} أسبوع` : `In ${weeks} wk`;
  }
  const months = Math.round(intervalDays / 30);
  return isArabic ? `بعد ${months} شهر` : `In ${months} mo`;
}
