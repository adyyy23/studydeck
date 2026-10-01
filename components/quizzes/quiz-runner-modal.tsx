"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trophy,
  Check,
} from "lucide-react";
import clsx from "clsx";
import { Quiz, QuizQuestion } from "@/lib/types";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { ContextualAIDrawer } from "@/components/ai/contextual-ai-drawer";

interface QuizRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  subjectCode?: string;
}

export function QuizRunnerModal({
  isOpen,
  onClose,
  quiz,
  subjectCode = "Subject",
}: QuizRunnerModalProps) {
  const { recordQuizAttempt, recordMistake } = useStudyStore();
  const { logSession } = useAcademicStore();
  const { user } = useAuthStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [hasSubmittedCurrent, setHasSubmittedCurrent] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    (quiz.timeLimitMinutes || 15) * 60
  );
  const [startTime] = useState<number>(Date.now());

  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState("");

  const [quizStreak, setQuizStreak] = useState(0);
  const [quizXP, setQuizXP] = useState(0);
  const [quizAccuracyLive, setQuizAccuracyLive] = useState(100);
  const [correctCountSoFar, setCorrectCountSoFar] = useState(0);
  const [answeredCountSoFar, setAnsweredCountSoFar] = useState(0);

  useEffect(() => {
    if (!isOpen || !quiz.isExamMode || isFinished) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, quiz.isExamMode, isFinished]);

  if (!isOpen || !quiz.questions || quiz.questions.length === 0) return null;

  const currentQ = quiz.questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (!quiz.isExamMode && hasSubmittedCurrent) return;
    setSelectedAnswer(opt);
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  const handleSubmitPracticeQuestion = () => {
    if (!selectedAnswer) return;
    setHasSubmittedCurrent(true);

    const isCorrect =
      selectedAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

    const newAnsweredCount = answeredCountSoFar + 1;
    setAnsweredCountSoFar(newAnsweredCount);

    if (isCorrect) {
      const newCorrectCount = correctCountSoFar + 1;
      setCorrectCountSoFar(newCorrectCount);
      const comboBonus = quizStreak * 2;
      setQuizXP(prev => prev + 5 + comboBonus);
      setQuizStreak(prev => prev + 1);
      setQuizAccuracyLive(Math.round((newCorrectCount / newAnsweredCount) * 100));
    } else {
      setQuizStreak(0);
      setQuizAccuracyLive(Math.round((correctCountSoFar / newAnsweredCount) * 100));
      if (user) {
        recordMistake({
          userId: user.id,
          subjectId: quiz.subjectId,
          moduleId: currentQ.moduleId,
          topicId: currentQ.topicId,
          questionId: currentQ.id,
          questionText: currentQ.question,
          lastUserAnswer: selectedAnswer,
          correctAnswer: currentQ.correctAnswer,
          explanation: currentQ.explanation,
        });
      }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < quiz.questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextQ = quiz.questions[nextIdx];
      setSelectedAnswer(answers[nextQ.id] || "");
      setHasSubmittedCurrent(false);
    } else {
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevQ = quiz.questions[prevIdx];
      setSelectedAnswer(answers[prevQ.id] || "");
      setHasSubmittedCurrent(quiz.isExamMode ? false : Boolean(answers[prevQ.id]));
    }
  };

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const finishQuiz = () => {
    setIsFinished(true);

    let correctCount = 0;
    quiz.questions.forEach((q) => {
      const userAns = answers[q.id] || "";
      const isCorrect =
        userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (isCorrect) {
        correctCount += 1;
      } else if (user) {
        recordMistake({
          userId: user.id,
          subjectId: quiz.subjectId,
          moduleId: q.moduleId,
          topicId: q.topicId,
          questionId: q.id,
          questionText: q.question,
          lastUserAnswer: userAns || "Unanswered",
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        });
      }
    });

    const accuracy = Math.round((correctCount / quiz.questions.length) * 100);
    const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    if (quiz.isExamMode) {
      setQuizAccuracyLive(accuracy);
    }

    if (user) {
      recordQuizAttempt({
        quizId: quiz.id,
        userId: user.id,
        subjectId: quiz.subjectId,
        score: correctCount,
        totalQuestions: quiz.questions.length,
        accuracy,
        timeSpentSeconds: timeSpent,
        userAnswers: answers,
        isExamMode: quiz.isExamMode,
      });

      logSession({
        userId: user.id,
        subjectId: quiz.subjectId,
        type: "quiz",
        durationMinutes: Math.max(1, Math.round(timeSpent / 60)),
        accuracy,
        itemsReviewed: quiz.questions.length,
        notes: `${quiz.title} (${quiz.isExamMode ? "Exam Mode" : "Practice Mode"})`,
      });
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const isCurrentCorrect = selectedAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div
        className="w-full max-w-3xl bg-surface rounded-xl shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Bar */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-slate-500">Q {currentIndex + 1} / {quiz.questions.length}</span>
            <span className="text-blue-600">Accuracy: {answeredCountSoFar > 0 ? quizAccuracyLive : 100}%</span>
            {!quiz.isExamMode && (
              <>
                <span className="text-amber-600 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Streak ×{quizStreak}</span>
                <span className="text-purple-600">XP: +{quizXP}</span>
              </>
            )}
            {quiz.isExamMode && (
              <span className="text-rose-600 flex items-center gap-1"><Clock className="w-3 h-3"/> {formatTimer(secondsRemaining)}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isFinished ? (
          <div className="flex-1 flex flex-col p-8 bg-surface overflow-y-auto">
            <div className="flex flex-col items-center justify-center text-center pb-8 border-b border-slate-200 dark:border-slate-800">
              <Trophy className="w-16 h-16 text-amber-400 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Quiz Complete</h2>
              
              <div className="flex gap-6 mt-6">
                <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl min-w-[100px]">
                  <span className="text-xs font-bold text-slate-500 uppercase">Score</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {quiz.questions.filter(q => (answers[q.id] || "").trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()).length}/{quiz.questions.length}
                  </span>
                </div>
                <div className="flex flex-col items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl min-w-[100px]">
                  <span className="text-xs font-bold text-blue-600 uppercase">Accuracy</span>
                  <span className="text-2xl font-bold text-blue-600">{quizAccuracyLive}%</span>
                </div>
                {!quiz.isExamMode && (
                  <div className="flex flex-col items-center bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl min-w-[100px]">
                    <span className="text-xs font-bold text-purple-600 uppercase">Total XP</span>
                    <span className="text-2xl font-bold text-purple-600">+{quizXP}</span>
                  </div>
                )}
              </div>

              <p className="mt-6 text-sm text-slate-500 font-medium">
                Mastery Impact: Calculated based on accuracy.<br/>
                {quiz.questions.length - (quiz.questions.filter(q => (answers[q.id] || "").trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()).length)} mistakes logged for review.
              </p>

              <div className="flex gap-4 mt-8">
                <button onClick={onClose} className="px-6 py-3 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-lg transition-colors">
                  Continue Studying
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-2xl mx-auto flex flex-col min-h-full">
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Question {currentIndex + 1} of {quiz.questions.length}
                  </span>
                  {(currentQ.type === "identification" || currentQ.type === "fill_blank") && (
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase rounded">
                      {currentQ.type.replace('_', ' ')}
                    </span>
                  )}
                  {quiz.isExamMode && (
                    <button
                      onClick={() => toggleFlag(currentQ.id)}
                      className={clsx(
                        "flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded transition-colors",
                        flagged[currentQ.id] ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {flagged[currentQ.id] ? "Flagged" : "Flag"}
                    </button>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-8 leading-snug">
                  {currentQ.question}
                </h3>

                <div className="flex-1">
                  {currentQ.options && currentQ.options.length > 0 ? (
                    <div className="space-y-3">
                      {currentQ.options.map((option, idx) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrectOption = option === currentQ.correctAnswer;
                        const showCorrectness = !quiz.isExamMode && hasSubmittedCurrent;

                        let btnClass = "border-slate-200 dark:border-slate-700 hover:bg-brand-50 hover:border-brand-200 text-slate-700 dark:text-slate-300";
                        if (showCorrectness) {
                          if (isCorrectOption) btnClass = "bg-green-50 border-green-400 text-green-800 font-bold";
                          else if (isSelected && !isCurrentCorrect) btnClass = "bg-red-50 border-red-400 text-red-800 font-bold";
                          else btnClass = "border-slate-200 text-slate-400 opacity-50"; // Dim unselected
                        } else if (isSelected) {
                          btnClass = "bg-brand-50 border-brand-500 font-bold text-brand-900";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectOption(option)}
                            disabled={showCorrectness}
                            className={clsx(
                              "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between text-sm",
                              btnClass
                            )}
                          >
                            <span>{option}</span>
                            {showCorrectness && isCorrectOption && <Check className="w-5 h-5 text-green-600" />}
                            {showCorrectness && isSelected && !isCurrentCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={selectedAnswer}
                      onChange={(e) => handleSelectOption(e.target.value)}
                      disabled={!quiz.isExamMode && hasSubmittedCurrent}
                      placeholder="Type your answer..."
                      className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-surface text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-brand-500"
                    />
                  )}
                </div>

                {!quiz.isExamMode && hasSubmittedCurrent && (
                  <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold">
                        {isCurrentCorrect ? (
                          <><CheckCircle2 className="w-5 h-5 text-green-600" /><span className="text-green-700">Correct!</span></>
                        ) : (
                          <><XCircle className="w-5 h-5 text-red-600" /><span className="text-red-700">Incorrect</span></>
                        )}
                      </div>
                      <span className={clsx("font-bold text-sm", isCurrentCorrect ? "text-amber-500" : "text-slate-500")}>
                        {isCurrentCorrect ? `+${5 + (quizStreak-1)*2} XP` : `Correct Answer: ${currentQ.correctAnswer}`}
                      </span>
                    </div>
                    {currentQ.explanation && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{currentQ.explanation}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 disabled:opacity-30 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {!quiz.isExamMode ? (
                !hasSubmittedCurrent ? (
                  <button
                    onClick={handleSubmitPracticeQuestion}
                    disabled={!selectedAnswer.trim()}
                    className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span>{currentIndex + 1 === quiz.questions.length ? "Finish Quiz" : "Next Question"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )
              ) : (
                <div className="flex gap-2">
                  {currentIndex + 1 === quiz.questions.length ? (
                    <button
                      onClick={finishQuiz}
                      className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                      Submit Exam
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ContextualAIDrawer
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        contextTitle={`${subjectCode} · Quiz Review`}
        initialQuery={aiInitialQuery}
      />
    </div>
  );
}
