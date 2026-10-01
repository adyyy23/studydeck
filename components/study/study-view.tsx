"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Layers,
  CheckSquare,
  AlertCircle,
  Gamepad2,
  Trash2,
  Upload,
  Play,
  File,
  Edit2,
  Image as ImageIcon,
  MessageSquare
} from "lucide-react";
import clsx from "clsx";
import { useStudyStore } from "@/lib/store/use-study-store";
import { useAuthStore } from "@/lib/store/use-auth-store";
import { calculateSubjectMastery } from "@/lib/mastery";
import { Subject, Module, Topic, StudyMaterial, Flashcard, Quiz } from "@/lib/types";

// Modals
import { FlashcardStudyModal } from "@/components/flashcards/flashcard-study-modal";
import { QuizRunnerModal } from "@/components/quizzes/quiz-runner-modal";
import { MistakeNotebookView } from "@/components/mistakes/mistake-notebook-view";
import { GamesHub } from "@/components/games/games-hub";
import { StudySetGeneratorModal } from "@/components/ai/study-set-generator-modal";
import { ContextualAIDrawer } from "@/components/ai/contextual-ai-drawer";
import { MaterialUploadModal } from "@/components/study/material-upload-modal";
import { MasteryRing } from "@/components/ui/mastery-ring";

function getSubjectColorClass(color: string) {
  switch (color) {
    case "cobalt": return "bg-blue-500";
    case "sage": return "bg-green-500";
    case "terracotta": return "bg-orange-500";
    case "teal": return "bg-teal-500";
    case "amber": return "bg-amber-500";
    case "crimson": return "bg-red-500";
    case "indigo": return "bg-indigo-500";
    default: return "bg-slate-500";
  }
}

function getMasteryLevelInfo(percentage: number) {
  if (percentage <= 25) return { label: "Beginner", color: "text-slate-500" };
  if (percentage <= 50) return { label: "Explorer", color: "text-blue-500" };
  if (percentage <= 75) return { label: "Scholar", color: "text-green-500" };
  return { label: "Expert", color: "text-amber-500" };
}

function getMilestoneText(percentage: number, totalCards: number) {
  if (totalCards === 0) return "Add flashcards to begin";
  if (percentage < 30) return "Reach 30% mastery";
  if (percentage < 60) return "Reach 60% mastery";
  if (percentage < 90) return "Reach 90% mastery";
  return "Course mastered!";
}

export function StudyView() {
  const searchParams = useSearchParams();
  const urlSubjectId = searchParams.get("subjectId");
  const urlTab = searchParams.get("tab");

  const {
    subjects,
    modules,
    topics,
    materials,
    flashcards,
    quizzes,
    quizAttempts,
    mistakes,
    addSubject,
    addModule,
    addFlashcard,
    addMaterial
  } = useStudyStore();

  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    urlSubjectId || (subjects[0]?.id ?? null)
  );

  const [activeTab, setActiveTab] = useState<
    "materials" | "flashcards" | "quizzes" | "mistakes" | "games"
  >((urlTab as any) || "materials");

  React.useEffect(() => {
    if (urlTab && ["materials", "flashcards", "quizzes", "mistakes", "games"].includes(urlTab)) {
      setActiveTab(urlTab as any);
    }
  }, [urlTab]);

  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);

  const [activeStudyCards, setActiveStudyCards] = useState<Flashcard[] | null>(null);
  const [activeQuizToRun, setActiveQuizToRun] = useState<Quiz | null>(null);
  const [materialForAIGenerator, setMaterialForAIGenerator] = useState<StudyMaterial | null>(null);
  const [aiContextDrawerOpen, setAiContextDrawerOpen] = useState(false);
  const [materialUploadOpen, setMaterialUploadOpen] = useState(false);

  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || null;

  const filteredSubjects = subjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subjectModules = modules.filter((m) => m.subjectId === selectedSubjectId);
  const subjectMaterials = materials.filter((m) => m.subjectId === selectedSubjectId);
  const subjectCards = flashcards.filter((c) => c.subjectId === selectedSubjectId);
  const subjectQuizzes = quizzes.filter((q) => q.subjectId === selectedSubjectId);
  const activeSubjectMistakes = mistakes.filter((m) => m.subjectId === selectedSubjectId && m.state !== "mastered");

  const masteryStats = activeSubject
    ? calculateSubjectMastery(
        activeSubject.id,
        flashcards,
        quizAttempts,
        mistakes,
        topics.filter((t) => t.subjectId === activeSubject.id)
      )
    : null;

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim() || !user) return;

    const created = addSubject({
      userId: user.id,
      code: newSubCode.trim(),
      name: newSubName.trim(),
      description: newSubDesc.trim(),
    });

    addModule(created.id, "Module 1: Fundamentals");

    setSelectedSubjectId(created.id);
    setNewSubCode("");
    setNewSubName("");
    setNewSubDesc("");
    setCreateSubjectOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left Panel: Subject List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-surface flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Subjects</h2>
            <button
              onClick={() => setCreateSubjectOpen(true)}
              className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none">
          {filteredSubjects.map((subject) => {
            const isSelected = subject.id === selectedSubjectId;
            const stats = calculateSubjectMastery(
              subject.id,
              flashcards,
              quizAttempts,
              mistakes,
              topics.filter((t) => t.subjectId === subject.id)
            );
            const levelInfo = getMasteryLevelInfo(stats.masteryPercentage);

            return (
              <button
                key={subject.id}
                onClick={() => setSelectedSubjectId(subject.id)}
                className={clsx(
                  "subject-card w-full text-left p-0 overflow-hidden rounded-xl border transition-all duration-200 flex",
                  isSelected
                    ? "bg-slate-50 dark:bg-slate-800/50 border-brand-300 dark:border-brand-700 shadow-sm"
                    : "bg-surface border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div className={clsx("w-1.5 shrink-0", getSubjectColorClass(subject.color))} />
                <div className="p-3 flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="mt-0.5 text-slate-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {subject.code}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {subject.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <MasteryRing percentage={stats.masteryPercentage} size={32} strokeWidth={3} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {stats.masteryPercentage}%
                        </span>
                        <span className={clsx("text-[10px] font-semibold uppercase", levelInfo.color)}>
                          {levelInfo.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {getMilestoneText(stats.masteryPercentage, stats.totalCards)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                    <span>{stats.totalCards} cards</span>
                    <span>{stats.totalQuizAttempts} quizzes</span>
                    <span>{stats.activeMistakes} mistakes</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Panel: Subject Details */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
        {!activeSubject ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Select a Subject</h2>
              <p className="text-sm text-slate-500">Choose a subject from the left panel to view its materials.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Bar */}
            <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-surface">
              <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
                {[
                  { id: "materials", label: "Materials", icon: FileText, count: subjectMaterials.length },
                  { id: "flashcards", label: "Flashcards", icon: Layers, count: subjectCards.length },
                  { id: "quizzes", label: "Quizzes", icon: CheckSquare, count: subjectQuizzes.length },
                  { id: "mistakes", label: "Mistakes", icon: AlertCircle, count: activeSubjectMistakes.length },
                  { id: "games", label: "Games", icon: Gamepad2, count: null },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={clsx(
                        "study-tab flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap",
                        isActive
                          ? "border-brand-700 text-brand-700"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-semibold text-sm">{tab.label}</span>
                      {tab.count !== null && (
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          isActive ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "materials" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">STUDY MATERIALS</h2>
                    <button
                      onClick={() => setMaterialUploadOpen(true)}
                      className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Material</span>
                    </button>
                  </div>

                  {subjectMaterials.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <p className="text-slate-500 text-sm">No materials added yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {subjectMaterials.map((mat) => {
                        let MaterialIcon = File;
                        let iconBg = "bg-slate-100 text-slate-500";
                        if (mat.type === "pdf") { MaterialIcon = FileText; iconBg = "bg-rose-100 text-rose-600"; }
                        else if (mat.type === "note") { MaterialIcon = Edit2; iconBg = "bg-amber-100 text-amber-600"; }
                        else if (mat.type === "image") { MaterialIcon = ImageIcon; iconBg = "bg-blue-100 text-blue-600"; }

                        const moduleName = subjectModules.find((m) => m.id === mat.moduleId)?.title || "General";

                        return (
                          <div key={mat.id} className="bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                              <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
                                <MaterialIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{mat.title}</h3>
                                <p className="text-xs text-slate-500 truncate">{moduleName}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase rounded-md mb-1">
                                  {mat.type}
                                </span>
                                <p className="text-[10px] text-slate-400">
                                  {new Date(mat.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                              <button onClick={() => setMaterialForAIGenerator(mat)} className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand-700 text-xs font-semibold rounded-md transition-colors text-center">
                                Create Flashcards
                              </button>
                              <button onClick={() => setMaterialForAIGenerator(mat)} className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-md transition-colors text-center">
                                Generate Quiz
                              </button>
                              <button onClick={() => setAiContextDrawerOpen(true)} className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md transition-colors" title="Ask AI">
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "flashcards" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">FLASHCARD DECK</h2>
                    {masteryStats && masteryStats.dueCards > 0 && (
                      <button
                        onClick={() => setActiveStudyCards(subjectCards.filter(c => c.state === 'new' || c.nextReviewDate <= new Date().toISOString().split("T")[0]))}
                        className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        <span>Study All Due ({masteryStats.dueCards})</span>
                      </button>
                    )}
                  </div>

                  {masteryStats && (
                    <div className="flex gap-4">
                      <div className="flex-1 bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-center items-center">
                        <span className="text-2xl font-bold text-slate-900">{masteryStats.totalCards}</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Total</span>
                      </div>
                      <div className="flex-1 bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-center items-center">
                        <span className="text-2xl font-bold text-emerald-600">{masteryStats.masteredCards}</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Mastered</span>
                      </div>
                      <div className="flex-1 bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-center items-center">
                        <span className="text-2xl font-bold text-amber-500">{masteryStats.dueCards}</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Due</span>
                      </div>
                      <div className="flex-1 bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-center items-center">
                        <span className="text-2xl font-bold text-blue-500">{masteryStats.learningCards}</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase">Learning</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {subjectCards.map((card) => {
                      let badgeColor = "bg-slate-100 text-slate-600";
                      if (card.state === "mastered") badgeColor = "bg-emerald-100 text-emerald-700";
                      else if (card.state === "learning") badgeColor = "bg-amber-100 text-amber-700";
                      else if (card.state === "review") badgeColor = "bg-blue-100 text-blue-700";

                      return (
                        <div key={card.id} className="bg-surface border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between gap-4">
                          <p className="flex-1 font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{card.front}</p>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className={clsx("px-2 py-1 text-[10px] font-bold uppercase rounded", badgeColor)}>
                              {card.state}
                            </span>
                            <span className="text-xs text-slate-500 w-24 text-right">
                              {new Date(card.nextReviewDate) <= new Date() ? "Due now" : `Due ${new Date(card.nextReviewDate).toLocaleDateString()}`}
                            </span>
                            <button onClick={() => setActiveStudyCards([card])} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors">
                              Study
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeTab === "quizzes" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">QUIZZES & EXAMS</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectQuizzes.map((qz) => {
                      const attempts = quizAttempts.filter(a => a.quizId === qz.id);
                      const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.accuracy)) : null;

                      return (
                        <div key={qz.id} className="bg-surface border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{qz.title}</h3>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">{qz.questions.length} questions</span>
                              <span className="text-slate-300">•</span>
                              <span className={clsx("px-2 py-0.5 rounded font-bold uppercase", qz.isExamMode ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                                {qz.isExamMode ? "Exam Mode" : "Practice Mode"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            {bestScore !== null ? (
                              <span className="text-sm font-bold text-emerald-600">Best: {bestScore}%</span>
                            ) : (
                              <span className="text-sm text-slate-400 font-medium">No attempts yet</span>
                            )}
                            <button onClick={() => setActiveQuizToRun(qz)} className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold rounded-lg transition-colors">
                              Start Quiz
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeTab === "mistakes" && <MistakeNotebookView subjectId={activeSubject.id} />}
              {activeTab === "games" && <GamesHub subjectId={activeSubject.id} />}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {createSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleCreateSubject} className="w-full max-w-sm bg-surface p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create New Subject</h3>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Subject Code</label>
              <input type="text" value={newSubCode} onChange={(e) => setNewSubCode(e.target.value)} placeholder="e.g. ITST 306" required className="mt-1 w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-500 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Subject Name</label>
              <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="UX/UI and Cross Platform Applications" required className="mt-1 w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-500 text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
              <textarea value={newSubDesc} onChange={(e) => setNewSubDesc(e.target.value)} rows={2} className="mt-1 w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-500 text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCreateSubjectOpen(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 rounded-lg bg-brand-700 text-white font-bold text-sm">Create Subject</button>
            </div>
          </form>
        </div>
      )}

      {activeStudyCards && (
        <FlashcardStudyModal
          isOpen={true}
          onClose={() => setActiveStudyCards(null)}
          cards={activeStudyCards}
          title={`${activeSubject?.code || "Subject"} Flashcards`}
          subjectId={activeSubject?.id}
        />
      )}

      {activeQuizToRun && (
        <QuizRunnerModal
          isOpen={true}
          onClose={() => setActiveQuizToRun(null)}
          quiz={activeQuizToRun}
          subjectCode={activeSubject?.code}
        />
      )}

      {materialForAIGenerator && (
        <StudySetGeneratorModal
          isOpen={true}
          onClose={() => setMaterialForAIGenerator(null)}
          material={materialForAIGenerator}
        />
      )}

      {activeSubject && (
        <ContextualAIDrawer
          isOpen={aiContextDrawerOpen}
          onClose={() => setAiContextDrawerOpen(false)}
          contextTitle={`${activeSubject.code}: ${activeSubject.name}`}
          subjectName={activeSubject.code}
          materialContent={subjectMaterials.map((m) => m.content).join("\n")}
        />
      )}

      {activeSubject && (
        <MaterialUploadModal
          isOpen={materialUploadOpen}
          onClose={() => setMaterialUploadOpen(false)}
          subjectId={activeSubject.id}
          userId={user?.id || ""}
          onActionSelect={(action) => {
            if (action === "flashcards") setActiveTab("flashcards");
            else if (action === "quiz") setActiveTab("quizzes");
            else if (action === "ai") setAiContextDrawerOpen(true);
            else if (action === "game") setActiveTab("games");
          }}
        />
      )}
    </div>
  );
}
