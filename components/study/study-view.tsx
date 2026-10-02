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
  ChevronDown,
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
  const [mobileCoursePickerOpen, setMobileCoursePickerOpen] = useState(false);

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
    <div className="flex flex-col h-full md:flex-row md:overflow-hidden bg-background font-sans text-foreground">
      {/* Mobile Course Switcher Bar (< md) */}
      <div className="md:hidden bg-[#FFFCF6] dark:bg-[#211A16] border-b border-[#D6CCBF] dark:border-[#44372E] p-3 flex flex-col gap-2 z-20">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setMobileCoursePickerOpen(!mobileCoursePickerOpen)}
            className="flex-1 flex items-center justify-between px-3 py-2 bg-[#F7F3EA] dark:bg-[#29211C] border border-[#D6CCBF] dark:border-[#44372E] rounded-lg text-xs font-bold text-[#332821] dark:text-[#F2EADF] touch-target"
          >
            <div className="flex items-center gap-2 truncate">
              <BookOpen className="w-4 h-4 text-[#B77A45] dark:text-[#D09A68] shrink-0" />
              <span className="truncate">{activeSubject ? `${activeSubject.code}: ${activeSubject.name}` : "Select Course..."}</span>
            </div>
            <ChevronDown className={clsx("w-4 h-4 text-[#756C64] dark:text-[#B9ADA1] shrink-0 transition-transform", mobileCoursePickerOpen && "rotate-180")} />
          </button>
          <button
            onClick={() => setCreateSubjectOpen(true)}
            className="px-2.5 py-2 bg-[#49372D] dark:bg-[#C28A5C] text-[#F7F3EA] dark:text-[#171310] rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 touch-target"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Mobile Course Dropdown Sheet */}
        {mobileCoursePickerOpen && (
          <div className="mt-1 p-2 bg-[#FFFCF6] dark:bg-[#211A16] border border-[#D6CCBF] dark:border-[#44372E] rounded-lg shadow-md max-h-60 overflow-y-auto space-y-1 animate-fade-in">
            {filteredSubjects.map((sub) => {
              const isSelected = sub.id === selectedSubjectId;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSelectedSubjectId(sub.id);
                    setMobileCoursePickerOpen(false);
                  }}
                  className={clsx(
                    "w-full text-left p-2.5 rounded-md text-xs transition-colors flex items-center justify-between touch-target",
                    isSelected
                      ? "bg-[#B77A45]/15 dark:bg-[#D09A68]/20 font-bold text-[#B77A45] dark:text-[#D09A68]"
                      : "hover:bg-[#F2EEE6] dark:hover:bg-[#29211C] text-[#332821] dark:text-[#F2EADF]"
                  )}
                >
                  <div className="truncate">
                    <span className="font-mono font-bold mr-2">{sub.code}</span>
                    <span className="text-[#756C64] dark:text-[#B9ADA1]">{sub.name}</span>
                  </div>
                  {isSelected && <span className="text-[10px] font-black uppercase text-[#B77A45] dark:text-[#D09A68]">Active</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Left Panel: Course Index / Subjects */}
      <div className="hidden md:flex md:w-72 lg:w-80 border-r border-[#D6CCBF] dark:border-[#44372E] bg-[#F7F3EA] dark:bg-[#171310] flex-col shrink-0 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        <div className="p-4 lg:p-5 border-b border-[#D6CCBF] dark:border-[#44372E]">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h2 className="text-[11px] font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-widest">My Courses</h2>
            <button
              onClick={() => setCreateSubjectOpen(true)}
              className="px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-[#B77A45] dark:text-[#D09A68] hover:bg-[#F2EEE6] dark:hover:bg-[#29211C] rounded transition-colors touch-target"
            >
              <Plus className="w-3 h-3" /> New Subject
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#756C64] dark:text-[#B9ADA1]" />
            <input
              type="text"
              placeholder="Search index..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FFFCF6] dark:bg-[#211A16] border border-[#D6CCBF] dark:border-[#44372E] text-[#332821] dark:text-[#F2EADF] rounded-md text-sm focus:outline-none focus:border-[#B77A45] dark:focus:border-[#D09A68] focus:ring-1 focus:ring-[#B77A45] transition-shadow placeholder-[#756C64]/60 dark:placeholder-[#B9ADA1]/60"
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
                  "w-full text-left p-3 rounded-lg border transition-all duration-200 flex flex-col gap-1 touch-target",
                  isSelected
                    ? "bg-[#FFFCF6] dark:bg-[#211A16] border-[#D6CCBF] dark:border-[#44372E] shadow-xs border-l-4 border-l-[#B77A45] dark:border-l-[#D09A68]"
                    : "bg-transparent border-transparent hover:bg-[#F2EEE6] dark:hover:bg-[#29211C] hover:border-[#D6CCBF] dark:hover:border-[#44372E]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={clsx("font-bold font-serif tracking-tight", isSelected ? "text-[#332821] dark:text-[#F2EADF]" : "text-[#49372D] dark:text-[#F2EADF]/80")}>
                    {subject.code}
                  </span>
                  {stats.dueCards > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#D79A45]" title={`${stats.dueCards} due`} />
                  )}
                </div>
                <span className={clsx("text-[11px] truncate block", isSelected ? "text-[#49372D] dark:text-[#F2EADF]" : "text-[#756C64] dark:text-[#B9ADA1]")}>
                  {subject.name}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-[#D6CCBF] dark:bg-[#44372E] rounded-full overflow-hidden">
                    <div className="h-full bg-[#B77A45] dark:bg-[#D09A68]" style={{ width: `${stats.masteryPercentage}%` }} />
                  </div>
                  <span className={clsx("text-[10px] font-bold", isSelected ? "text-[#B77A45] dark:text-[#D09A68]" : "text-[#756C64] dark:text-[#B9ADA1]")}>
                    {stats.masteryPercentage}%
                  </span>
                </div>
                <span className="text-[10px] text-[#756C64] dark:text-[#B9ADA1] mt-0.5">
                  {stats.dueCards} due • {stats.totalCards} cards
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Area: Course Field Journal */}
      <div className="flex-1 flex flex-col bg-background dark:bg-[#171310] overflow-y-auto md:overflow-hidden relative">
        {/* Background Texture Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {!activeSubject ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center relative z-10">
            <div className="max-w-sm space-y-4">
              <BookOpen className="w-16 h-16 text-[#D6CCBF] dark:text-[#44372E] mx-auto" />
              <h2 className="text-xl font-serif font-bold text-[#49372D] dark:text-[#F2EADF]">Academic Field Journal</h2>
              <p className="text-sm text-[#756C64] dark:text-[#B9ADA1]">Select a course from the index to view your notes and training materials.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:overflow-hidden relative z-10">
            {/* Course Header */}
            <div className="px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-4 sm:pb-6 bg-[#FFFCF6] dark:bg-[#211A16] border-b border-[#D6CCBF] dark:border-[#44372E] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-[#332821] dark:text-[#F2EADF] tracking-tight mb-1 sm:mb-2">
                    {activeSubject.code}: {activeSubject.name}
                  </h1>
                  <div className="flex items-center gap-3 text-xs font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-widest">
                    <span>Active Semester</span>
                    <span>•</span>
                    <span>{subjectModules.length} Modules</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setActiveStudyCards(subjectCards.filter(c => c.state === 'new' || c.nextReviewDate <= new Date().toISOString().split("T")[0]))}
                    className="px-3.5 py-2 bg-[#49372D] dark:bg-[#C28A5C] hover:bg-[#332821] dark:hover:bg-[#D39B6B] text-[#F7F3EA] dark:text-[#171310] text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs touch-target"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Study Deck
                  </button>
                  <button
                    onClick={() => setMaterialUploadOpen(true)}
                    className="px-3.5 py-2 bg-[#FFFCF6] dark:bg-[#29211C] hover:bg-[#F2EEE6] dark:hover:bg-[#332820] text-[#49372D] dark:text-[#F2EADF] border border-[#D6CCBF] dark:border-[#44372E] text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-colors touch-target"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Material
                  </button>
                  <button
                    onClick={() => setAiContextDrawerOpen(true)}
                    className="px-3.5 py-2 bg-[#FFFCF6] dark:bg-[#29211C] hover:bg-[#F2EEE6] dark:hover:bg-[#332820] text-[#49372D] dark:text-[#F2EADF] border border-[#D6CCBF] dark:border-[#44372E] text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 transition-colors touch-target"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#6B4E71] dark:text-[#A78BFA]" /> Ask Lumi
                  </button>
                </div>
              </div>

              {masteryStats && (
                <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="flex-1">
                    <div className="flex items-end justify-between mb-1.5">
                      <span className="text-xs sm:text-sm font-bold text-[#49372D] dark:text-[#F2EADF] uppercase tracking-wider">{masteryStats.masteryPercentage}% Mastery</span>
                      <span className="text-[11px] sm:text-xs text-[#756C64] dark:text-[#B9ADA1] font-medium">Next Milestone: {Math.min(100, Math.ceil((masteryStats.masteryPercentage + 1) / 25) * 25)}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#F2EEE6] dark:bg-[#29211C] rounded-full overflow-hidden border border-[#D6CCBF] dark:border-[#44372E]">
                      <div className="h-full bg-[#B77A45] dark:bg-[#D09A68]" style={{ width: `${masteryStats.masteryPercentage}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="block text-xl sm:text-2xl font-serif font-bold text-[#332821] dark:text-[#F2EADF] leading-none">{masteryStats.dueCards}</span>
                      <span className="text-[10px] font-bold text-[#D79A45] dark:text-[#DCAA54] uppercase tracking-widest">Cards Due</span>
                    </div>
                    <div className="w-px h-8 bg-[#D6CCBF] dark:bg-[#44372E]" />
                    <div className="text-left sm:text-right">
                      <span className="block text-xl sm:text-2xl font-serif font-bold text-[#332821] dark:text-[#F2EADF] leading-none">{activeSubjectMistakes.length}</span>
                      <span className="text-[10px] font-bold text-[#B84A39] dark:text-[#f87171] uppercase tracking-widest">Mistakes</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Navigation - Horizontally Scrollable without truncation */}
            <div className="px-3 sm:px-6 lg:px-8 bg-[#FFFCF6] dark:bg-[#211A16] border-b border-[#D6CCBF] dark:border-[#44372E]">
              <div className="flex items-center gap-3 sm:gap-6 lg:gap-8 overflow-x-auto scrollbar-none py-1">
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
                        "relative py-3.5 flex items-center gap-1.5 text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 touch-target",
                        isActive
                          ? "font-bold text-[#49372D] dark:text-[#F2EADF]"
                          : "font-semibold text-[#756C64] dark:text-[#B9ADA1] hover:text-[#49372D] dark:hover:text-[#F2EADF]"
                      )}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span className={clsx(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold",
                          isActive
                            ? "bg-[#B77A45] dark:bg-[#D09A68] text-white dark:text-[#171310]"
                            : "bg-[#F2EEE6] dark:bg-[#29211C] text-[#756C64] dark:text-[#B9ADA1]"
                        )}>
                          {tab.count}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#B77A45] dark:bg-[#D09A68]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
              {activeTab === "materials" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  {subjectMaterials.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-[#D6CCBF] dark:border-[#44372E] bg-[#FFFCF6] dark:bg-[#211A16] rounded-xl shadow-sm">
                      <FileText className="w-12 h-12 text-[#D6CCBF] dark:text-[#44372E] mx-auto mb-4" />
                      <p className="text-[#49372D] dark:text-[#F2EADF] font-bold mb-2">No documents filed yet.</p>
                      <p className="text-[#756C64] dark:text-[#B9ADA1] text-sm">Upload syllabus, reading materials, or notes.</p>
                      <button
                        onClick={() => setMaterialUploadOpen(true)}
                        className="mt-6 px-4 py-2 bg-[#49372D] dark:bg-[#C28A5C] text-[#F7F3EA] dark:text-[#171310] text-sm font-bold rounded-lg shadow-sm"
                      >
                        Upload First Document
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {subjectMaterials.map((mat) => {
                        let MaterialIcon = File;
                        let accentColor = "text-[#756C64] dark:text-[#B9ADA1]";
                        if (mat.type === "pdf") { MaterialIcon = FileText; accentColor = "text-[#ef4444]"; }
                        else if (mat.type === "note") { MaterialIcon = Edit2; accentColor = "text-[#B77A45] dark:text-[#D09A68]"; }
                        else if (mat.type === "image") { MaterialIcon = ImageIcon; accentColor = "text-[#3b82f6]"; }

                        const moduleName = subjectModules.find((m) => m.id === mat.moduleId)?.title || "General";

                        return (
                          <div key={mat.id} className="bg-[#FFFCF6] dark:bg-[#211A16] border border-[#D6CCBF] dark:border-[#44372E] p-5 rounded-xl shadow-sm flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-[#F7F3EA] dark:bg-[#29211C] border-l border-b border-[#D6CCBF] dark:border-[#44372E] transform rotate-45 translate-x-8 -translate-y-8" />
                            <div className="flex items-start gap-4 z-10">
                              <div className={clsx("p-3 bg-[#F2EEE6] dark:bg-[#29211C] border border-[#D6CCBF] dark:border-[#44372E] rounded-lg", accentColor)}>
                                <MaterialIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#332821] dark:text-[#F2EADF] truncate font-serif text-lg leading-tight mb-1">{mat.title}</h3>
                                <div className="flex items-center gap-2 text-[11px] font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-wider">
                                  <span>{moduleName}</span>
                                  <span>•</span>
                                  <span>{mat.type}</span>
                                </div>
                              </div>
                              <button className="text-[#D6CCBF] dark:text-[#44372E] hover:text-[#49372D] dark:hover:text-[#F2EADF] transition-colors">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-4 border-t border-[#F2EEE6] dark:border-[#29211C] z-10">
                              <button onClick={() => setMaterialForAIGenerator(mat)} className="flex-1 py-2 bg-[#F7F3EA] dark:bg-[#29211C] hover:bg-[#F2EEE6] dark:hover:bg-[#332820] border border-[#D6CCBF] dark:border-[#44372E] text-[#49372D] dark:text-[#F2EADF] text-xs font-bold rounded-lg transition-colors text-center shadow-sm">
                                Extract Flashcards
                              </button>
                              <button onClick={() => setMaterialForAIGenerator(mat)} className="flex-1 py-2 bg-[#F7F3EA] dark:bg-[#29211C] hover:bg-[#F2EEE6] dark:hover:bg-[#332820] border border-[#D6CCBF] dark:border-[#44372E] text-[#49372D] dark:text-[#F2EADF] text-xs font-bold rounded-lg transition-colors text-center shadow-sm">
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
                    <div className="bg-[#FFFCF6] dark:bg-[#211A16] border border-[#D6CCBF] dark:border-[#44372E] rounded-xl p-6 shadow-sm flex flex-wrap gap-8 items-center">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="font-bold font-serif text-lg text-[#332821] dark:text-[#F2EADF] mb-2">Deck Status</h3>
                        <p className="text-sm text-[#756C64] dark:text-[#B9ADA1]">Review due items regularly to maintain high recall efficiency.</p>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-center">
                          <span className="block text-2xl font-bold font-mono text-[#10b981]">{masteryStats.masteredCards}</span>
                          <span className="text-[10px] font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-widest">Mastered</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold font-mono text-[#3b82f6]">{masteryStats.learningCards}</span>
                          <span className="text-[10px] font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-widest">Learning</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-2xl font-bold font-mono text-[#D79A45] dark:text-[#DCAA54]">{masteryStats.dueCards}</span>
                          <span className="text-[10px] font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-widest">Due</span>
                        </div>
                      </div>
                      {masteryStats.dueCards > 0 && (
                        <button
                          onClick={() => setActiveStudyCards(subjectCards.filter(c => c.state === 'new' || c.nextReviewDate <= new Date().toISOString().split("T")[0]))}
                          className="px-6 py-3 bg-[#D79A45] dark:bg-[#DCAA54] hover:bg-[#B77A45] text-white dark:text-[#171310] text-sm font-bold rounded-lg shadow-sm transition-colors"
                        >
                          Study All Due
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    {subjectCards.map((card) => {
                      let badgeColor = "bg-[#F2EEE6] dark:bg-[#29211C] text-[#756C64] dark:text-[#B9ADA1] border-[#D6CCBF] dark:border-[#44372E]";
                      if (card.state === "mastered") badgeColor = "bg-[#d1fae5] dark:bg-[#052E16] text-[#059669] dark:text-[#6ee7b7] border-[#a7f3d0] dark:border-[#059669]";
                      else if (card.state === "learning") badgeColor = "bg-[#fef3c7] dark:bg-[#2B2016] text-[#d97706] dark:text-[#fde68a] border-[#fde68a] dark:border-[#d97706]";
                      else if (card.state === "review") badgeColor = "bg-[#dbeafe] dark:bg-[#1E1B3A] text-[#2563eb] dark:text-[#93c5fd] border-[#bfdbfe] dark:border-[#3b82f6]";

                      return (
                        <div key={card.id} className="bg-[#FFFCF6] dark:bg-[#211A16] border border-[#D6CCBF] dark:border-[#44372E] rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:border-[#B77A45] dark:hover:border-[#D09A68] transition-colors group">
                          <p className="flex-1 font-medium text-sm text-[#332821] dark:text-[#F2EADF] truncate font-serif">{card.front}</p>
                          <div className="flex items-center gap-4 shrink-0">
                            <span className={clsx("px-2 py-1 text-[10px] font-bold uppercase rounded-md border", badgeColor)}>
                              {card.state}
                            </span>
                            <span className="text-xs font-bold text-[#756C64] dark:text-[#B9ADA1] w-24 text-right flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(card.nextReviewDate) <= new Date() ? "Due now" : new Date(card.nextReviewDate).toLocaleDateString()}
                            </span>
                            <button onClick={() => setActiveStudyCards([card])} className="px-3 py-1.5 bg-[#F2EEE6] dark:bg-[#29211C] hover:bg-[#E6DFD3] dark:hover:bg-[#332820] text-[#49372D] dark:text-[#F2EADF] text-xs font-bold rounded-lg transition-colors opacity-0 group-hover:opacity-100">
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
                        <div key={qz.id} className="bg-[#FFFCF6] dark:bg-[#211A16] border border-[#D6CCBF] dark:border-[#44372E] rounded-xl p-6 shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between mb-4">
                              <span className={clsx("px-2 py-1 rounded-md text-[10px] font-bold uppercase border", qz.isExamMode ? "bg-[#f3e8ff] dark:bg-[#2D1B69] text-[#7e22ce] dark:text-[#c4b5fd] border-[#e9d5ff] dark:border-[#5b21b6]" : "bg-[#dbeafe] dark:bg-[#1E1B3A] text-[#2563eb] dark:text-[#93c5fd] border-[#bfdbfe] dark:border-[#3b82f6]")}>
                                {qz.isExamMode ? "Exam Set" : "Practice Set"}
                              </span>
                              <span className="text-xs font-bold text-[#756C64] dark:text-[#B9ADA1] bg-[#F2EEE6] dark:bg-[#29211C] px-2 py-1 rounded-md">
                                {qz.questions.length} Qs
                              </span>
                            </div>
                            <h3 className="font-bold font-serif text-xl text-[#332821] dark:text-[#F2EADF] mb-2">{qz.title}</h3>
                          </div>
                          <div className="flex items-end justify-between mt-6 pt-4 border-t border-[#F2EEE6] dark:border-[#29211C]">
                            <div>
                              <span className="block text-[10px] font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-widest mb-1">Best Score</span>
                              {bestScore !== null ? (
                                <span className="text-lg font-bold font-mono text-[#10b981]">{bestScore}%</span>
                              ) : (
                                <span className="text-sm font-medium text-[#D6CCBF] dark:text-[#44372E]">--</span>
                              )}
                            </div>
                            <button onClick={() => setActiveQuizToRun(qz)} className="px-5 py-2.5 bg-[#49372D] dark:bg-[#C28A5C] hover:bg-[#332821] dark:hover:bg-[#D39B6B] text-[#F7F3EA] dark:text-[#171310] text-sm font-bold rounded-lg transition-colors shadow-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#332821]/40 dark:bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleCreateSubject} className="w-full max-w-sm bg-[#FFFCF6] dark:bg-[#211A16] border-2 border-[#D6CCBF] dark:border-[#44372E] p-8 rounded-xl shadow-xl space-y-5">
            <h3 className="text-xl font-serif font-bold text-[#332821] dark:text-[#F2EADF]">New Course Entry</h3>
            <div>
              <label className="text-[11px] font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-widest">Course Code</label>
              <input type="text" value={newSubCode} onChange={(e) => setNewSubCode(e.target.value)} placeholder="e.g. ITST 306" required className="mt-1.5 w-full p-2.5 bg-[#F7F3EA] dark:bg-[#29211C] rounded-lg border border-[#D6CCBF] dark:border-[#44372E] focus:outline-none focus:border-[#B77A45] dark:focus:border-[#D09A68] font-bold text-[#49372D] dark:text-[#F2EADF] text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-widest">Course Title</label>
              <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="UX/UI Design" required className="mt-1.5 w-full p-2.5 bg-[#F7F3EA] dark:bg-[#29211C] rounded-lg border border-[#D6CCBF] dark:border-[#44372E] focus:outline-none focus:border-[#B77A45] dark:focus:border-[#D09A68] text-sm text-[#49372D] dark:text-[#F2EADF]" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#756C64] dark:text-[#B9ADA1] uppercase tracking-widest">Description</label>
              <textarea value={newSubDesc} onChange={(e) => setNewSubDesc(e.target.value)} rows={2} className="mt-1.5 w-full p-2.5 bg-[#F7F3EA] dark:bg-[#29211C] rounded-lg border border-[#D6CCBF] dark:border-[#44372E] focus:outline-none focus:border-[#B77A45] dark:focus:border-[#D09A68] text-sm text-[#49372D] dark:text-[#F2EADF]" />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setCreateSubjectOpen(false)} className="flex-1 py-2.5 rounded-lg bg-[#F2EEE6] dark:bg-[#29211C] hover:bg-[#E6DFD3] dark:hover:bg-[#332820] border border-[#D6CCBF] dark:border-[#44372E] text-[#49372D] dark:text-[#F2EADF] font-bold text-sm transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 rounded-lg bg-[#49372D] dark:bg-[#C28A5C] hover:bg-[#332821] dark:hover:bg-[#D39B6B] text-[#F7F3EA] dark:text-[#171310] font-bold text-sm transition-colors">Create</button>
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
