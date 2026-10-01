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
  MessageSquare,
  ChevronRight,
  MoreVertical,
  Clock
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#F2EEE6] font-sans text-[#332821]">
      {/* Left Panel: Course Index / Subjects */}
      <div className="w-80 border-r border-[#D6CCBF] bg-[#F7F3EA] flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        <div className="p-5 border-b border-[#D6CCBF]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold text-[#756C64] uppercase tracking-widest">My Courses</h2>
            <button
              onClick={() => setCreateSubjectOpen(true)}
              className="px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-[#B77A45] hover:bg-[#F2EEE6] rounded transition-colors"
            >
              <Plus className="w-3 h-3" /> New Subject
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#756C64]" />
            <input
              type="text"
              placeholder="Search index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FFFCF6] border border-[#D6CCBF] rounded-md text-sm focus:outline-none focus:border-[#B77A45] focus:ring-1 focus:ring-[#B77A45] transition-shadow placeholder-[#756C64]/60"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
          {filteredSubjects.map((subject) => {
            const isSelected = subject.id === selectedSubjectId;
            const stats = calculateSubjectMastery(
              subject.id,
              flashcards,
              quizAttempts,
              mistakes,
              topics.filter((t) => t.subjectId === subject.id)
            );

            return (
              <button
                key={subject.id}
                onClick={() => setSelectedSubjectId(subject.id)}
                className={clsx(
                  "w-full text-left p-3 rounded-lg border transition-all duration-200 flex flex-col gap-1",
                  isSelected
                    ? "bg-[#FFFCF6] border-[#D6CCBF] shadow-sm border-l-4 border-l-[#B77A45]"
                    : "bg-transparent border-transparent hover:bg-[#F2EEE6] hover:border-[#D6CCBF]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={clsx("font-bold font-serif tracking-tight", isSelected ? "text-[#332821]" : "text-[#49372D]")}>
                    {subject.code}
                  </span>
                  {stats.dueCards > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#D79A45]" title={`${stats.dueCards} due`} />
                  )}
                </div>
                <span className={clsx("text-[11px] truncate block", isSelected ? "text-[#49372D]" : "text-[#756C64]")}>
                  {subject.name}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-[#D6CCBF] rounded-full overflow-hidden">
                    <div className="h-full bg-[#B77A45]" style={{ width: `${stats.masteryPercentage}%` }} />
                  </div>
                  <span className={clsx("text-[10px] font-bold", isSelected ? "text-[#B77A45]" : "text-[#756C64]")}>
                    {stats.masteryPercentage}%
                  </span>
                </div>
                <span className="text-[10px] text-[#756C64] mt-0.5">
                  {stats.dueCards} due • {stats.totalCards} cards
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Area: Course Field Journal */}
      <div className="flex-1 flex flex-col bg-[#F2EEE6] overflow-hidden relative">
        {/* Background Texture Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#332821 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {!activeSubject ? (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="text-center space-y-4">
              <BookOpen className="w-16 h-16 text-[#D6CCBF] mx-auto" />
              <h2 className="text-xl font-serif font-bold text-[#49372D]">Academic Field Journal</h2>
              <p className="text-sm text-[#756C64]">Select a course from the index to view your notes and training materials.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative z-10">
            {/* Course Header */}
            <div className="px-8 pt-8 pb-6 bg-[#FFFCF6] border-b border-[#D6CCBF] shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-[#332821] tracking-tight mb-2">
                    {activeSubject.code}: {activeSubject.name}
                  </h1>
                  <div className="flex items-center gap-4 text-xs font-bold text-[#756C64] uppercase tracking-widest">
                    <span>Fall Semester</span>
                    <span>•</span>
                    <span>{subjectModules.length} Modules</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveStudyCards(subjectCards.filter(c => c.state === 'new' || c.nextReviewDate <= new Date().toISOString().split("T")[0]))}
                    className="px-4 py-2 bg-[#49372D] hover:bg-[#332821] text-[#F7F3EA] text-sm font-bold rounded flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current" /> Study Flashcards
                  </button>
                  <button
                    onClick={() => setMaterialUploadOpen(true)}
                    className="px-4 py-2 bg-[#FFFCF6] hover:bg-[#F2EEE6] text-[#49372D] border border-[#D6CCBF] text-sm font-bold rounded flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Material
                  </button>
                  <button
                    onClick={() => setAiContextDrawerOpen(true)}
                    className="px-4 py-2 bg-[#FFFCF6] hover:bg-[#F2EEE6] text-[#49372D] border border-[#D6CCBF] text-sm font-bold rounded flex items-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-[#8b5cf6]" /> Ask Lumi
                  </button>
                </div>
              </div>

              {masteryStats && (
                <div className="mt-8 flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-sm font-bold text-[#49372D] uppercase tracking-wider">{masteryStats.masteryPercentage}% Mastery</span>
                      <span className="text-xs text-[#756C64] font-medium">Next Milestone: {Math.min(100, Math.ceil(masteryStats.masteryPercentage / 25) * 25)}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#F2EEE6] rounded-full overflow-hidden border border-[#D6CCBF]">
                      <div className="h-full bg-[#B77A45]" style={{ width: `${masteryStats.masteryPercentage}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-4 shrink-0">
                    <div className="text-right">
                      <span className="block text-2xl font-serif font-bold text-[#332821] leading-none">{masteryStats.dueCards}</span>
                      <span className="text-[10px] font-bold text-[#D79A45] uppercase tracking-widest">Cards Due</span>
                    </div>
                    <div className="w-px h-8 bg-[#D6CCBF]" />
                    <div className="text-right">
                      <span className="block text-2xl font-serif font-bold text-[#332821] leading-none">{activeSubjectMistakes.length}</span>
                      <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-widest">Mistakes</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="px-8 bg-[#FFFCF6] border-b border-[#D6CCBF]">
              <div className="flex items-center gap-8">
                {[
                  { id: "materials", label: "Materials", count: subjectMaterials.length },
                  { id: "flashcards", label: "Flashcards", count: subjectCards.length },
                  { id: "quizzes", label: "Quizzes", count: subjectQuizzes.length },
                  { id: "mistakes", label: "Mistakes", count: activeSubjectMistakes.length },
                  { id: "games", label: "Games", count: null },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={clsx(
                        "relative py-4 flex items-center gap-2 text-sm transition-colors whitespace-nowrap",
                        isActive
                          ? "font-bold text-[#49372D]"
                          : "font-semibold text-[#756C64] hover:text-[#49372D]"
                      )}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          isActive ? "bg-[#B77A45] text-[#FFFCF6]" : "bg-[#F2EEE6] text-[#756C64]"
                        )}>
                          {tab.count}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#B77A45]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === "materials" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {subjectMaterials.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-[#D6CCBF] bg-[#FFFCF6] rounded-xl shadow-sm">
                      <FileText className="w-12 h-12 text-[#D6CCBF] mx-auto mb-4" />
                      <p className="text-[#49372D] font-bold mb-2">No documents filed yet.</p>
                      <p className="text-[#756C64] text-sm">Upload syllabus, reading materials, or notes.</p>
                      <button
                        onClick={() => setMaterialUploadOpen(true)}
                        className="mt-6 px-4 py-2 bg-[#49372D] text-[#F7F3EA] text-sm font-bold rounded"
                      >
                        Upload First Document
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {subjectMaterials.map((mat) => {
                        let MaterialIcon = File;
                        let accentColor = "text-[#756C64]";
                        if (mat.type === "pdf") { MaterialIcon = FileText; accentColor = "text-[#ef4444]"; }
                        else if (mat.type === "note") { MaterialIcon = Edit2; accentColor = "text-[#B77A45]"; }
                        else if (mat.type === "image") { MaterialIcon = ImageIcon; accentColor = "text-[#3b82f6]"; }

                        const moduleName = subjectModules.find((m) => m.id === mat.moduleId)?.title || "General";

                        return (
                          <div key={mat.id} className="bg-[#FFFCF6] border border-[#D6CCBF] p-5 rounded-lg shadow-sm flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-[#F7F3EA] border-l border-b border-[#D6CCBF] transform rotate-45 translate-x-8 -translate-y-8" />
                            <div className="flex items-start gap-4 z-10">
                              <div className={clsx("p-3 bg-[#F2EEE6] border border-[#D6CCBF] rounded", accentColor)}>
                                <MaterialIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#332821] truncate font-serif text-lg leading-tight mb-1">{mat.title}</h3>
                                <div className="flex items-center gap-2 text-[11px] font-bold text-[#756C64] uppercase tracking-wider">
                                  <span>{moduleName}</span>
                                  <span>•</span>
                                  <span>{mat.type}</span>
                                </div>
                              </div>
                              <button className="text-[#D6CCBF] hover:text-[#49372D] transition-colors">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-4 border-t border-[#F2EEE6] z-10">
                              <button onClick={() => setMaterialForAIGenerator(mat)} className="flex-1 py-2 bg-[#F7F3EA] hover:bg-[#F2EEE6] border border-[#D6CCBF] text-[#49372D] text-xs font-bold rounded transition-colors text-center shadow-sm">
                                Extract Flashcards
                              </button>
                              <button onClick={() => setMaterialForAIGenerator(mat)} className="flex-1 py-2 bg-[#F7F3EA] hover:bg-[#F2EEE6] border border-[#D6CCBF] text-[#49372D] text-xs font-bold rounded transition-colors text-center shadow-sm">
                                Create Quiz
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
                <div className="max-w-4xl mx-auto space-y-6">
                  {masteryStats && (
                    <div className="bg-[#FFFCF6] border border-[#D6CCBF] rounded-lg p-6 shadow-sm flex flex-wrap gap-8 items-center">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="font-bold font-serif text-lg text-[#332821] mb-2">Deck Status</h3>
                        <p className="text-sm text-[#756C64]">Review due items regularly to maintain high recall efficiency.</p>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-center">
                          <span className="block text-2xl font-bold font-mono text-[#10b981]">{masteryStats.masteredCards}</span>
                          <span className="text-[10px] font-bold text-[#756C64] uppercase tracking-widest">Mastered</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold font-mono text-[#3b82f6]">{masteryStats.learningCards}</span>
                          <span className="text-[10px] font-bold text-[#756C64] uppercase tracking-widest">Learning</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold font-mono text-[#D79A45]">{masteryStats.dueCards}</span>
                          <span className="text-[10px] font-bold text-[#756C64] uppercase tracking-widest">Due</span>
                        </div>
                      </div>
                      {masteryStats.dueCards > 0 && (
                        <button
                          onClick={() => setActiveStudyCards(subjectCards.filter(c => c.state === 'new' || c.nextReviewDate <= new Date().toISOString().split("T")[0]))}
                          className="px-6 py-3 bg-[#D79A45] hover:bg-[#B77A45] text-[#FFFCF6] text-sm font-bold rounded shadow-sm transition-colors"
                        >
                          Study All Due
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    {subjectCards.map((card) => {
                      let badgeColor = "bg-[#F2EEE6] text-[#756C64] border-[#D6CCBF]";
                      if (card.state === "mastered") badgeColor = "bg-[#d1fae5] text-[#059669] border-[#a7f3d0]";
                      else if (card.state === "learning") badgeColor = "bg-[#fef3c7] text-[#d97706] border-[#fde68a]";
                      else if (card.state === "review") badgeColor = "bg-[#dbeafe] text-[#2563eb] border-[#bfdbfe]";

                      return (
                        <div key={card.id} className="bg-[#FFFCF6] border border-[#D6CCBF] rounded-md p-4 flex items-center justify-between gap-4 shadow-sm hover:border-[#B77A45] transition-colors group">
                          <p className="flex-1 font-medium text-sm text-[#332821] truncate font-serif">{card.front}</p>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className={clsx("px-2 py-1 text-[10px] font-bold uppercase rounded border", badgeColor)}>
                              {card.state}
                            </span>
                            <span className="text-xs font-bold text-[#756C64] w-24 text-right flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(card.nextReviewDate) <= new Date() ? "Due now" : new Date(card.nextReviewDate).toLocaleDateString()}
                            </span>
                            <button onClick={() => setActiveStudyCards([card])} className="px-3 py-1.5 bg-[#F2EEE6] hover:bg-[#E6DFD3] text-[#49372D] text-xs font-bold rounded transition-colors opacity-0 group-hover:opacity-100">
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
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {subjectQuizzes.map((qz) => {
                      const attempts = quizAttempts.filter(a => a.quizId === qz.id);
                      const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.accuracy)) : null;

                      return (
                        <div key={qz.id} className="bg-[#FFFCF6] border border-[#D6CCBF] rounded-lg p-6 shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-4">
                              <span className={clsx("px-2 py-1 rounded text-[10px] font-bold uppercase border", qz.isExamMode ? "bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]" : "bg-[#dbeafe] text-[#2563eb] border-[#bfdbfe]")}>
                                {qz.isExamMode ? "Exam Set" : "Practice Set"}
                              </span>
                              <span className="text-xs font-bold text-[#756C64] bg-[#F2EEE6] px-2 py-1 rounded">
                                {qz.questions.length} Qs
                              </span>
                            </div>
                            <h3 className="font-bold font-serif text-xl text-[#332821] mb-2">{qz.title}</h3>
                          </div>
                          <div className="flex items-end justify-between mt-6 pt-4 border-t border-[#F2EEE6]">
                            <div>
                              <span className="block text-[10px] font-bold text-[#756C64] uppercase tracking-widest mb-1">Best Score</span>
                              {bestScore !== null ? (
                                <span className="text-lg font-bold font-mono text-[#10b981]">{bestScore}%</span>
                              ) : (
                                <span className="text-sm font-medium text-[#D6CCBF]">--</span>
                              )}
                            </div>
                            <button onClick={() => setActiveQuizToRun(qz)} className="px-5 py-2.5 bg-[#49372D] hover:bg-[#332821] text-[#F7F3EA] text-sm font-bold rounded transition-colors shadow-sm">
                              Start {qz.isExamMode ? "Exam" : "Practice"}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeTab === "mistakes" && (
                <div className="max-w-4xl mx-auto h-full min-h-[500px]">
                  <MistakeNotebookView subjectId={activeSubject.id} />
                </div>
              )}
              
              {activeTab === "games" && (
                <div className="w-full">
                  <GamesHub subjectId={activeSubject.id} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {createSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#332821]/40 backdrop-blur-sm">
          <form onSubmit={handleCreateSubject} className="w-full max-w-sm bg-[#FFFCF6] border-2 border-[#D6CCBF] p-8 rounded-xl shadow-xl space-y-5">
            <h3 className="text-xl font-serif font-bold text-[#332821]">New Course Entry</h3>
            <div>
              <label className="text-[11px] font-bold text-[#756C64] uppercase tracking-widest">Course Code</label>
              <input type="text" value={newSubCode} onChange={(e) => setNewSubCode(e.target.value)} placeholder="e.g. ITST 306" required className="mt-1.5 w-full p-2.5 bg-[#F7F3EA] rounded border border-[#D6CCBF] focus:outline-none focus:border-[#B77A45] font-bold text-[#49372D] text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#756C64] uppercase tracking-widest">Course Title</label>
              <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="UX/UI Design" required className="mt-1.5 w-full p-2.5 bg-[#F7F3EA] rounded border border-[#D6CCBF] focus:outline-none focus:border-[#B77A45] text-sm text-[#49372D]" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#756C64] uppercase tracking-widest">Description</label>
              <textarea value={newSubDesc} onChange={(e) => setNewSubDesc(e.target.value)} rows={2} className="mt-1.5 w-full p-2.5 bg-[#F7F3EA] rounded border border-[#D6CCBF] focus:outline-none focus:border-[#B77A45] text-sm text-[#49372D]" />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setCreateSubjectOpen(false)} className="flex-1 py-2.5 rounded bg-[#F2EEE6] hover:bg-[#E6DFD3] border border-[#D6CCBF] text-[#49372D] font-bold text-sm transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 rounded bg-[#49372D] hover:bg-[#332821] text-[#F7F3EA] font-bold text-sm transition-colors">Create</button>
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
