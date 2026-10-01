import { Flashcard, Rating, CardState } from "./types";

/**
 * SuperMemo 2 (SM-2) algorithm adapted for StudyDeck spaced repetition.
 * Returns updated flashcard with recalculated interval, easeFactor, repetitions,
 * next review date, and mastery state.
 */
export function calculateNextReview(
  card: Flashcard,
  rating: Rating
): {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  state: CardState;
  nextReviewDate: string;
} {
  let { intervalDays, easeFactor, repetitions } = card;

  // Grade numeric equivalent (0-5 scale in SM-2):
  // again: 1, hard: 3, good: 4, easy: 5
  let grade = 4;
  if (rating === "again") grade = 1;
  else if (rating === "hard") grade = 3;
  else if (rating === "good") grade = 4;
  else if (rating === "easy") grade = 5;

  // Calculate new Ease Factor:
  // EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  let newEaseFactor =
    easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  if (newEaseFactor > 2.8) newEaseFactor = 2.8;

  let newRepetitions = repetitions;
  let newInterval = intervalDays;
  let newState: CardState = card.state;

  if (grade < 3) {
    // Incorrect / Again
    newRepetitions = 0;
    newInterval = 1; // 1 day
    newState = "learning";
  } else {
    // Correct (Hard, Good, or Easy)
    newRepetitions += 1;
    if (newRepetitions === 1) {
      newInterval = 1;
      newState = "learning";
    } else if (newRepetitions === 2) {
      newInterval = rating === "hard" ? 3 : 6;
      newState = "review";
    } else {
      const multiplier = rating === "hard" ? 1.2 : rating === "easy" ? 1.35 : 1.0;
      newInterval = Math.round(newInterval * newEaseFactor * multiplier);
      if (newRepetitions >= 4 && newInterval >= 21) {
        newState = "mastered";
      } else {
        newState = "review";
      }
    }
  }

  // Calculate next review ISO date
  const now = new Date();
  const nextDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  return {
    intervalDays: newInterval,
    easeFactor: parseFloat(newEaseFactor.toFixed(2)),
    repetitions: newRepetitions,
    state: newState,
    nextReviewDate: nextDate.toISOString().split("T")[0],
  };
}

/**
 * Determine if a card is due for review today or overdue.
 */
export function isCardDue(card: Flashcard): boolean {
  if (card.state === "new") return true;
  const todayStr = new Date().toISOString().split("T")[0];
  return card.nextReviewDate <= todayStr;
}
