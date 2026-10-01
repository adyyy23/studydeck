"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, BookOpen, Layers, FileText, CheckSquare, Sparkles } from "lucide-react";
import clsx from "clsx";
import { useStudyStore } from "@/lib/store/use-study-store";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { subjects, modules, topics, materials, flashcards, quizzes } = useStudyStore();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedSubjects = subjects.filter(
      (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );

    const matchedModules = modules.filter((m) => m.title.toLowerCase().includes(q));

    const matchedTopics = topics.filter((t) => t.title.toLowerCase().includes(q));

    const matchedMaterials = materials.filter(
      (m) => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)
    );

    const matchedCards = flashcards.filter(
      (c) => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
    );

    const matchedQuestions = quizzes.flatMap((qz) =>
      qz.questions.filter((item) => item.question.toLowerCase().includes(q))
    );

    const totalMatches =
      matchedSubjects.length +
      matchedModules.length +
      matchedTopics.length +
      matchedMaterials.length +
      matchedCards.length +
      matchedQuestions.length;

    return {
      totalMatches,
      subjects: matchedSubjects,
      modules: matchedModules,
      topics: matchedTopics,
      materials: matchedMaterials,
      flashcards: matchedCards,
      questions: matchedQuestions,
    };
  }, [query, subjects, modules, topics, materials, flashcards, quizzes]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-surface rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, modules, notes, flashcards..."
            className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
          >
            Esc
          </button>
        </div>

        {/* Search Results / Content Area */}
        <div className="overflow-y-auto p-4 flex-1">
          {!query.trim() ? (
            <div className="text-center py-10 text-slate-400 text-xs sm:text-sm">
              Type a term, subject code (e.g. &quot;ITST 306&quot;), or keyword to explore your knowledge base.
            </div>
          ) : results?.totalMatches === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No matching study content found for &quot;{query}&quot;.
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-sm">
              {/* Subjects */}
              {results && results.subjects.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Subjects ({results.subjects.length})</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {results.subjects.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => navigateTo(`/study?subjectId=${sub.id}`)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors"
                      >
                        <div>
                          <span className="font-semibold text-brand-700 dark:text-blue-400 mr-2">
                            {sub.code}
                          </span>
                          <span className="text-slate-700 dark:text-slate-200">{sub.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Materials & Notes */}
              {results && results.materials.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Materials & Notes ({results.materials.length})</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {results.materials.map((mat) => (
                      <button
                        key={mat.id}
                        onClick={() => navigateTo(`/study?subjectId=${mat.subjectId}`)}
                        className="flex flex-col p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors"
                      >
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {mat.title}
                        </span>
                        <span className="text-xs text-slate-500 line-clamp-1">
                          {mat.content}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Flashcards */}
              {results && results.flashcards.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Flashcards ({results.flashcards.length})</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {results.flashcards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => navigateTo(`/study?subjectId=${card.subjectId}`)}
                        className="flex flex-col p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors"
                      >
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {card.front}
                        </span>
                        <span className="text-xs text-slate-500 line-clamp-1">{card.back}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions */}
              {results && results.questions.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Quiz Questions ({results.questions.length})</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {results.questions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigateTo(`/study?subjectId=${q.subjectId}`)}
                        className="flex flex-col p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors"
                      >
                        <span className="text-slate-900 dark:text-slate-100">{q.question}</span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                          Correct: {q.correctAnswer}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
