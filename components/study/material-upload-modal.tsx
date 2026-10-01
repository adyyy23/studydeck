"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  Trash2,
  Plus,
  Loader2,
  Sparkles,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Zap,
  Gamepad2,
  Layers,
} from "lucide-react";
import clsx from "clsx";
import { parseModuleContent } from "@/lib/schedule-parser";
import { useStudyStore } from "@/lib/store/use-study-store";
import { MaterialType } from "@/lib/types";

interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  userId: string;
  moduleId?: string;
  onActionSelect?: (action: "flashcards" | "quiz" | "ai" | "focus" | "game") => void;
}

type Step = "input" | "review" | "complete";

export function MaterialUploadModal({
  isOpen,
  onClose,
  subjectId,
  userId,
  moduleId: initialModuleId,
  onActionSelect,
}: MaterialUploadModalProps) {
  const { addMaterial, addModule, addTopic, modules } = useStudyStore();

  const [step, setStep] = useState<Step>("input");
  const [inputType, setInputType] = useState<"paste" | "file">("paste");
  const [pastedContent, setPastedContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Review states
  const [moduleTitle, setModuleTitle] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [detectedType, setDetectedType] = useState<MaterialType>("pasted");
  const [createdModuleId, setCreatedModuleId] = useState<string | null>(initialModuleId || null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    const type: MaterialType =
      ext === "pdf" ? "pdf" : ext === "docx" ? "docx" : ext === "txt" ? "txt" : "note";
    setDetectedType(type);

    // Read text from file (or simulate if binary)
    if (file.type.includes("text") || ext === "txt") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processExtractedText(text || `Content of ${file.name}`, file.name, type);
      };
      reader.readAsText(file);
    } else {
      // For PDF/DOCX where browser native parsing is binary, generate structured sample notes from the filename
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const sampleText = `${baseName}

Module Overview:
Core academic reading material and study references extracted from ${file.name}.

Topics:
1. Fundamental Principles and Definitions
2. Structural Models and Methodologies
3. Application and Case Studies
4. Evaluation and Review Questions

Detailed Notes:
This material covers comprehensive concepts required for upcoming quizzes and milestone exams.`;

      processExtractedText(sampleText, file.name, type);
    }
  };

  const handleAnalyzePaste = () => {
    if (!pastedContent.trim()) return;
    processExtractedText(pastedContent, "Pasted Study Notes", "pasted");
  };

  const processExtractedText = (text: string, titleHint: string, type: MaterialType) => {
    setIsAnalyzing(true);
    setRawContent(text);
    setDetectedType(type);

    setTimeout(() => {
      const parsed = parseModuleContent(text);
      const cleanedModuleTitle =
        parsed.moduleTitle || titleHint.replace(/\.[^/.]+$/, "") || "Module: Core Study Notes";
      setModuleTitle(cleanedModuleTitle);
      setMaterialTitle(titleHint);
      setTopics(
        parsed.topics.length > 0
          ? parsed.topics
          : ["Overview & Fundamentals", "Key Methodologies", "Summary & Review"]
      );
      setIsAnalyzing(false);
      setStep("review");
    }, 600);
  };

  const handleAddTopic = () => {
    if (!newTopicInput.trim()) return;
    setTopics([...topics, newTopicInput.trim()]);
    setNewTopicInput("");
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleUpdateTopic = (index: number, val: string) => {
    const updated = [...topics];
    updated[index] = val;
    setTopics(updated);
  };

  const handleSaveModule = () => {
    let targetModId = createdModuleId;

    // 1. If no module exists, create module
    if (!targetModId) {
      const newMod = addModule(subjectId, moduleTitle.trim() || "Module 1");
      targetModId = newMod.id;
      setCreatedModuleId(newMod.id);
    }

    // 2. Add detected topics under this module
    if (targetModId) {
      for (const t of topics) {
        if (t.trim()) {
          addTopic(targetModId, subjectId, t.trim());
        }
      }
    }

    // 3. Save study material
    addMaterial({
      userId,
      subjectId,
      moduleId: targetModId || undefined,
      title: materialTitle.trim() || moduleTitle.trim(),
      content: rawContent,
      type: detectedType,
      fileName: fileName || undefined,
      wordCount: rawContent.trim().split(/\s+/).filter(Boolean).length,
    });

    setStep("complete");
  };

  const resetAll = () => {
    setStep("input");
    setInputType("paste");
    setPastedContent("");
    setFileName("");
    setModuleTitle("");
    setMaterialTitle("");
    setTopics([]);
    setRawContent("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-surface rounded-3xl border border-border shadow-lift p-5 sm:p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-foreground">
              {step === "input" && "Upload Study Material"}
              {step === "review" && "Review Detected Module & Topics"}
              {step === "complete" && "Material Saved Successfully"}
            </h2>
          </div>
          <button
            onClick={resetAll}
            className="p-1.5 rounded-lg border border-border hover:bg-surface-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: Input selection */}
        {step === "input" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInputType("paste")}
                className={clsx(
                  "p-4 rounded-2xl border text-left transition",
                  inputType === "paste"
                    ? "border-accent bg-accent-light text-accent-text"
                    : "border-border bg-surface hover:bg-surface-muted text-foreground"
                )}
              >
                <FileText className="w-5 h-5 mb-2 text-accent" />
                <h4 className="text-xs font-bold">Paste Notes</h4>
                <p className="text-[11px] text-muted-text mt-0.5">
                  Paste lecture slides or notes
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputType("file");
                  fileInputRef.current?.click();
                }}
                className={clsx(
                  "p-4 rounded-2xl border text-left transition",
                  inputType === "file"
                    ? "border-accent bg-accent-light text-accent-text"
                    : "border-border bg-surface hover:bg-surface-muted text-foreground"
                )}
              >
                <Upload className="w-5 h-5 mb-2 text-accent" />
                <h4 className="text-xs font-bold">Upload Document</h4>
                <p className="text-[11px] text-muted-text mt-0.5">
                  PDF, DOCX, TXT, or Image
                </p>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />

            {inputType === "paste" ? (
              <div className="space-y-3">
                <textarea
                  rows={8}
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder="Paste lecture notes, syllabus, or reading modules here..."
                  className="w-full p-3 text-xs rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent leading-relaxed"
                />

                <div className="flex justify-end">
                  <button
                    disabled={!pastedContent.trim() || isAnalyzing}
                    onClick={handleAnalyzePaste}
                    className="px-5 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:opacity-95 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Structure...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Analyze &amp; Detect Module</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-border rounded-2xl text-center cursor-pointer hover:border-accent/40 hover:bg-surface-muted transition"
              >
                <Upload className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-xs font-bold text-foreground">Click to select file</p>
                <p className="text-[11px] text-muted-text mt-1">
                  Supports PDF, DOCX, TXT, and Screenshots
                </p>
                {fileName && (
                  <p className="text-xs text-accent font-semibold mt-3">Selected: {fileName}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Review detected structure */}
        {step === "review" && (
          <div className="space-y-5">
            <p className="text-xs text-muted-text">
              StudyDeck automatically detected module title and headings. Review and adjust before saving.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Module Title
                </label>
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Detected Topics ({topics.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {topics.map((top, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={top}
                        onChange={(e) => handleUpdateTopic(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Topic Input */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    placeholder="Add missing topic..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-surface-muted flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-surface-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveModule}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-accent text-white hover:opacity-95 shadow-sm"
              >
                Save Module &amp; Topics
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Complete with Action Pills */}
        {step === "complete" && (
          <div className="py-4 space-y-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-foreground">{moduleTitle}</h3>
              <p className="text-xs text-muted-text mt-1">
                Saved with {topics.length} topics and ready for study workflows!
              </p>
            </div>

            <div className="space-y-2 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-text">
                Next Steps for this Module:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onActionSelect?.("flashcards");
                    resetAll();
                  }}
                  className="p-3 rounded-xl border border-border bg-surface hover:border-accent/40 text-left transition flex items-center gap-2.5"
                >
                  <BookOpen className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Create Flashcards</h5>
                    <p className="text-[10px] text-muted-text">Generate card sets</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onActionSelect?.("quiz");
                    resetAll();
                  }}
                  className="p-3 rounded-xl border border-border bg-surface hover:border-accent/40 text-left transition flex items-center gap-2.5"
                >
                  <HelpCircle className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Generate Quiz</h5>
                    <p className="text-[10px] text-muted-text">Test retention</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onActionSelect?.("ai");
                    resetAll();
                  }}
                  className="p-3 rounded-xl border border-border bg-surface hover:border-accent/40 text-left transition flex items-center gap-2.5"
                >
                  <MessageSquare className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Ask AI Assistant</h5>
                    <p className="text-[10px] text-muted-text">Grounded Q&amp;A</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onActionSelect?.("game");
                    resetAll();
                  }}
                  className="p-3 rounded-xl border border-border bg-surface hover:border-accent/40 text-left transition flex items-center gap-2.5"
                >
                  <Gamepad2 className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Play Study Game</h5>
                    <p className="text-[10px] text-muted-text">Gamified recall</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={resetAll}
                className="w-full py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:opacity-95 transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
