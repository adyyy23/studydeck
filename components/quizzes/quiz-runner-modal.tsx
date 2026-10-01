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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#332821]/50 backdrop-blur-sm">
      <div
        className="w-full max-w-3xl bg-[#F7F3EA] dark:bg-[#221B17] border border-[#D6CCBF] dark:border-[#3D322B] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Bar */}
        <div className="bg-[#FFFCF6] dark:bg-[#2B231E] border-b border-[#D6CCBF] dark:border-[#3D322B] px-3 sm:px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs font-bold">
            <span className="text-[#756C64] dark:text-[#9E9186] uppercase tracking-wider">
              Q {currentIndex + 1} / {quiz.questions.length}
            </span>
            <span className="text-[#3D6B4F]">
              Acc: {answeredCountSoFar > 0 ? quizAccuracyLive : 100}%
            </span>
            {!quiz.isExamMode && (
              <>
                <span className="text-[#B77A45] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#D79A45]" /> Streak ×{quizStreak}
                </span>
                <span className="text-[#D79A45] font-black">XP: +{quizXP}</span>
              </>
            )}
            {quiz.isExamMode && (
              <span className="text-[#B84A39] flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatTimer(secondsRemaining)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6] rounded-lg transition-colors touch-target"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isFinished ? (
          <div className="flex-1 flex flex-col p-6 sm:p-8 bg-[#F7F3EA] dark:bg-[#221B17] overflow-y-auto">
            <div className="flex flex-col items-center justify-center text-center pb-6 sm:pb-8">
              <div className="w-14 h-14 rounded-full border-2 border-double border-[#D79A45] bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] flex items-center justify-center mb-4">
                <Trophy className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-serif font-black text-[#332821] dark:text-[#F2EEE6] uppercase tracking-wide">
                Quiz Complete
              </h2>
              <p className="text-xs text-[#756C64] dark:text-[#9E9186] mt-1">
                Field assessment evaluation concluded.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 max-w-sm w-full">
                <div className="flex flex-col items-center bg-[#FFFCF6] dark:bg-[#2B231E] p-3 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B]">
                  <span className="text-[10px] font-bold text-[#756C64] dark:text-[#9E9186] uppercase">Score</span>
                  <span className="text-xl sm:text-2xl font-black text-[#332821] dark:text-[#F2EEE6]">
                    {quiz.questions.filter(q => (answers[q.id] || "").trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()).length}/{quiz.questions.length}
                  </span>
                </div>
                <div className="flex flex-col items-center bg-[#FFFCF6] dark:bg-[#2B231E] p-3 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B]">
                  <span className="text-[10px] font-bold text-[#756C64] dark:text-[#9E9186] uppercase">Accuracy</span>
                  <span className="text-xl sm:text-2xl font-black text-[#3D6B4F]">{quizAccuracyLive}%</span>
                </div>
                {!quiz.isExamMode && (
                  <div className="col-span-2 sm:col-span-1 flex flex-col items-center bg-[#FFFBEB] dark:bg-[#382A1E] p-3 rounded-lg border border-[#D79A45]/30">
                    <span className="text-[10px] font-bold text-[#B77A45] dark:text-[#D79A45] uppercase">Total XP</span>
                    <span className="text-xl sm:text-2xl font-black text-[#D79A45]">+{quizXP}</span>
                  </div>
                )}
              </div>

              <p className="mt-6 text-xs text-[#756C64] dark:text-[#9E9186] font-medium">
                Mastery calibrated to your academic record.<br/>
                {quiz.questions.length - (quiz.questions.filter(q => (answers[q.id] || "").trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()).length)} mistakes logged to notebook.
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="btn-primary py-2.5 px-6 text-xs font-bold uppercase tracking-wider touch-target"
                >
                  Continue Studying
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-[#F7F3EA] dark:bg-[#221B17] relative overflow-hidden">
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <div className="max-w-2xl mx-auto flex flex-col min-h-full">
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-[#756C64] dark:text-[#9E9186] uppercase tracking-widest">
                    Question {currentIndex + 1} of {quiz.questions.length}
                  </span>
                  {(currentQ.type === "identification" || currentQ.type === "fill_blank") && (
                    <span className="px-2 py-0.5 bg-[#EAE3D8] dark:bg-[#2E2520] text-[#654A3A] dark:text-[#D79A45] text-[10px] font-bold uppercase rounded border border-[#D6CCBF] dark:border-[#3D322B]">
                      {currentQ.type.replace('_', ' ')}
                    </span>
                  )}
                  {quiz.isExamMode && (
                    <button
                      onClick={() => toggleFlag(currentQ.id)}
                      className={clsx(
                        "flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors touch-target",
                        flagged[currentQ.id]
                          ? "bg-[#FFFBEB] dark:bg-[#382A1E] text-[#B77A45] dark:text-[#D79A45] border-[#D79A45]/40"
                          : "bg-[#FFFCF6] dark:bg-[#2B231E] text-[#756C64] dark:text-[#9E9186] border-[#D6CCBF] dark:border-[#3D322B]"
                      )}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{flagged[currentQ.id] ? "Flagged" : "Flag"}</span>
                    </button>
                  )}
                </div>

                <div className="p-4 sm:p-6 rounded-xl bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B] mb-6 shadow-xs">
                  <h3 className="text-base sm:text-xl font-serif font-black text-[#332821] dark:text-[#F2EEE6] leading-snug">
                    {currentQ.question}
                  </h3>
                </div>

                <div className="flex-1">
                  {currentQ.options && currentQ.options.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentQ.options.map((option, idx) => {
                        const isSelected = selectedAnswer === option;
                        const isCorrectOption = option === currentQ.correctAnswer;
                        const showCorrectness = !quiz.isExamMode && hasSubmittedCurrent;

                        let btnClass = "bg-[#FFFCF6] dark:bg-[#2B231E] border-[#D6CCBF] dark:border-[#3D322B] hover:border-[#654A3A] text-[#332821] dark:text-[#F2EEE6]";
                        if (showCorrectness) {
                          if (isCorrectOption) btnClass = "bg-[#F0FDF4] dark:bg-[#052E16] border-[#3D6B4F] text-[#3D6B4F] dark:text-[#86EFAC] font-bold";
                          else if (isSelected && !isCurrentCorrect) btnClass = "bg-[#FEF2F2] dark:bg-[#450A0A] border-[#B84A39] text-[#B84A39] dark:text-[#FCA5A5] font-bold";
                          else btnClass = "border-[#D6CCBF] dark:border-[#3D322B] text-[#756C64] dark:text-[#9E9186] opacity-60";
                        } else if (isSelected) {
                          btnClass = "bg-[#FFFBEB] dark:bg-[#382A1E] border-[#D79A45] text-[#332821] dark:text-[#F2EEE6] font-bold ring-2 ring-[#D79A45]/30";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectOption(option)}
                            disabled={showCorrectness}
                            className={clsx(
                              "w-full p-3.5 sm:p-4 rounded-xl border text-left transition-all flex items-center justify-between text-xs sm:text-sm touch-target",
                              btnClass
                            )}
                          >
                            <span className="leading-snug">{option}</span>
                            {showCorrectness && isCorrectOption && <Check className="w-4 h-4 text-[#3D6B4F] shrink-0 ml-2" />}
                            {showCorrectness && isSelected && !isCurrentCorrect && <XCircle className="w-4 h-4 text-[#B84A39] shrink-0 ml-2" />}
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
                      className="w-full p-3.5 sm:p-4 rounded-xl border border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] text-[#332821] dark:text-[#F2EEE6] font-medium focus:outline-none focus:border-[#B77A45] text-sm"
                    />
                  )}
                </div>

                {!quiz.isExamMode && hasSubmittedCurrent && (
                  <div className="mt-5 p-4 rounded-xl bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B] flex flex-col gap-2 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                        {isCurrentCorrect ? (
                          <><CheckCircle2 className="w-4 h-4 text-[#3D6B4F]" /><span className="text-[#3D6B4F]">Correct!</span></>
                        ) : (
                          <><XCircle className="w-4 h-4 text-[#B84A39]" /><span className="text-[#B84A39]">Incorrect</span></>
                        )}
                      </div>
                      <span className={clsx("font-bold text-xs", isCurrentCorrect ? "text-[#D79A45]" : "text-[#756C64] dark:text-[#9E9186]")}>
                        {isCurrentCorrect ? `+${5 + (quizStreak-1)*2} XP` : `Correct Answer: ${currentQ.correctAnswer}`}
                      </span>
                    </div>
                    {currentQ.explanation && (
                      <p className="text-xs text-[#756C64] dark:text-[#9E9186] mt-1 leading-relaxed">{currentQ.explanation}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 bg-[#FFFCF6] dark:bg-[#2B231E] border-t border-[#D6CCBF] dark:border-[#3D322B] flex items-center justify-between shrink-0">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="px-3 py-2 text-xs sm:text-sm font-bold text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6] disabled:opacity-30 transition-colors flex items-center gap-1.5 touch-target"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>

              {!quiz.isExamMode ? (
                !hasSubmittedCurrent ? (
                  <button
                    onClick={handleSubmitPracticeQuestion}
                    disabled={!selectedAnswer.trim()}
                    className="btn-primary py-2.5 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider touch-target"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="btn-primary py-2.5 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 touch-target"
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
                      className="btn-primary py-2.5 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider touch-target"
                    >
                      Submit Exam
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="btn-primary py-2.5 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 touch-target"
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
