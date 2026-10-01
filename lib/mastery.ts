import { Flashcard, QuizAttempt, MistakeItem } from "./types";

export interface SubjectMasteryStats {
  masteryPercentage: number; // 0 - 100
  totalCards: number;
  masteredCards: number;
  reviewCards: number;
  learningCards: number;
  dueCards: number;
  quizAccuracy: number; // 0 - 100
  totalQuizAttempts: number;
  activeMistakes: number;
  resolvedMistakes: number;
  weakTopics: { topicId: string; topicTitle: string; mastery: number }[];
}

/**
 * Centralized Academic Mastery Calculation
 * 
 * Formula:
 * - If no activity exists: returns 0%
 * - Flashcard Component (40% weight):
 *     (masteredCards * 1.0 + reviewCards * 0.6 + learningCards * 0.2) / totalCards
 * - Quiz Performance Component (40% weight):
 *     Average quiz accuracy on subject quizzes (recent attempts weighted higher)
 * - Mistake Resolution Component (20% weight):
 *     resolvedMistakes / (activeMistakes + resolvedMistakes)
 * 
 * Weak Topics are dynamically detected where topic mastery is < 65% or active mistakes >= 2.
 */
export function calculateSubjectMastery(
  subjectId: string,
  flashcards: Flashcard[],
  quizAttempts: QuizAttempt[],
  mistakes: MistakeItem[],
  topics: { id: string; title: string; moduleId: string }[] = []
): SubjectMasteryStats {
  const subjectCards = flashcards.filter((c) => c.subjectId === subjectId);
  const subjectQuizzes = quizAttempts.filter((q) => q.subjectId === subjectId);
  const subjectMistakes = mistakes.filter((m) => m.subjectId === subjectId);

  const totalCards = subjectCards.length;
  const masteredCards = subjectCards.filter((c) => c.state === "mastered").length;
  const reviewCards = subjectCards.filter((c) => c.state === "review").length;
  const learningCards = subjectCards.filter((c) => c.state === "learning").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const dueCards = subjectCards.filter(
    (c) => c.state === "new" || c.nextReviewDate <= todayStr
  ).length;

  // Flashcard score (0 - 100)
  const flashcardScore =
    totalCards > 0
      ? ((masteredCards * 1.0 + reviewCards * 0.6 + learningCards * 0.2) /
          totalCards) *
        100
      : 0;

  // Quiz score (0 - 100)
  let quizAccuracy = 0;
  if (subjectQuizzes.length > 0) {
    const totalAccuracy = subjectQuizzes.reduce((acc, q) => acc + q.accuracy, 0);
    quizAccuracy = Math.round(totalAccuracy / subjectQuizzes.length);
  }

  // Mistake resolution score (0 - 100)
  const activeMistakes = subjectMistakes.filter((m) => m.state !== "mastered").length;
  const resolvedMistakes = subjectMistakes.filter((m) => m.state === "mastered").length;
  const totalMistakesLogged = activeMistakes + resolvedMistakes;

  let mistakeScore = 100;
  if (totalMistakesLogged > 0) {
    mistakeScore = Math.round((resolvedMistakes / totalMistakesLogged) * 100);
  } else if (totalCards === 0 && subjectQuizzes.length === 0) {
    mistakeScore = 0;
  }

  // Blended Mastery calculation
  let finalMastery = 0;
  if (totalCards === 0 && subjectQuizzes.length === 0) {
    finalMastery = 0;
  } else if (totalCards > 0 && subjectQuizzes.length === 0) {
    // Only cards studied so far
    finalMastery = Math.round(flashcardScore);
  } else if (totalCards === 0 && subjectQuizzes.length > 0) {
    // Only quizzes taken
    finalMastery = Math.round(quizAccuracy * 0.8 + mistakeScore * 0.2);
  } else {
    // Full ecosystem: 40% cards, 40% quizzes, 20% mistake resolution
    finalMastery = Math.round(
      flashcardScore * 0.4 + quizAccuracy * 0.4 + mistakeScore * 0.2
    );
  }

  // Compute Weak Topics
  const weakTopics: { topicId: string; topicTitle: string; mastery: number }[] = [];
  topics.forEach((t) => {
    const topicCards = subjectCards.filter((c) => c.topicId === t.id);
    const topicMistakes = subjectMistakes.filter(
      (m) => m.topicId === t.id && m.state !== "mastered"
    );
    const topicCardMastery =
      topicCards.length > 0
        ? (topicCards.filter((c) => c.state === "mastered").length /
            topicCards.length) *
          100
        : 0;

    if (topicMistakes.length >= 2 || (topicCards.length > 0 && topicCardMastery < 65)) {
      weakTopics.push({
        topicId: t.id,
        topicTitle: t.title,
        mastery: Math.round(topicCardMastery),
      });
    }
  });

  return {
    masteryPercentage: Math.min(100, Math.max(0, finalMastery)),
    totalCards,
    masteredCards,
    reviewCards,
    learningCards,
    dueCards,
    quizAccuracy,
    totalQuizAttempts: subjectQuizzes.length,
    activeMistakes,
    resolvedMistakes,
    weakTopics,
  };
}

/**
 * Overall student mastery stats across all subjects
 */
export function calculateOverallMastery(
  flashcards: Flashcard[],
  quizAttempts: QuizAttempt[],
  mistakes: MistakeItem[],
  sessions: { durationMinutes: number }[]
) {
  const totalCardsMastered = flashcards.filter((c) => c.state === "mastered").length;
  const avgQuizAccuracy =
    quizAttempts.length > 0
      ? Math.round(
          quizAttempts.reduce((acc, q) => acc + q.accuracy, 0) /
            quizAttempts.length
        )
      : 0;
  const resolvedMistakesCount = mistakes.filter((m) => m.state === "mastered").length;
  const totalStudyMinutes = sessions.reduce(
    (acc, s) => acc + (s.durationMinutes || 0),
    0
  );

  return {
    cardsMastered: totalCardsMastered,
    quizAccuracy: avgQuizAccuracy,
    mistakesResolved: resolvedMistakesCount,
    totalStudyMinutes,
    totalSessions: sessions.length,
  };
}
