"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  X,
  FileText,
  Upload,
  PlusCircle,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  GraduationCap,
  ChevronLeft,
} from "lucide-react";
import clsx from "clsx";
import { parseScheduleText } from "@/lib/schedule-parser";
import { useAcademicStore } from "@/lib/store/use-academic-store";
import { useStudyStore } from "@/lib/store/use-study-store";
import { ParsedClass, DayOfWeek, Subject } from "@/lib/types";
import { Character } from "@/components/ui/character";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportMethod = "paste" | "file" | "manual";

interface EditableClass {
  /** Unique key for react list rendering */
  _key: string;
  subjectCode: string;
  subjectName: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  room: string;
  instructor: string;
  section: string;
  confidence: ParsedClass["confidence"];
}

interface DuplicateResolution {
  code: string;
  existingSubject: Subject;
  /** null = not yet resolved */
  useExisting: boolean | null;
}

type WizardStep = 1 | 2 | 3 | 4;

const ALL_DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateKey() {
  return `k_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function parsedToEditable(p: ParsedClass): EditableClass {
  return {
    _key: generateKey(),
    subjectCode: p.subjectCode,
    subjectName: p.subjectName,
    days: p.days,
    startTime: p.startTime,
    endTime: p.endTime,
    room: p.room,
    instructor: p.instructor,
    section: p.section,
    confidence: p.confidence,
  };
}

function blankClass(): EditableClass {
  return {
    _key: generateKey(),
    subjectCode: "",
    subjectName: "",
    days: [],
    startTime: "",
    endTime: "",
    room: "",
    instructor: "",
    section: "",
    confidence: {
      subjectCode: 1,
      subjectName: 1,
      days: 1,
      startTime: 1,
      endTime: 1,
      room: 1,
      instructor: 1,
    },
  };
}

// ─── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: WizardStep; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <div
            className={clsx(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
              step < current
                ? "border-transparent text-white"
                : step === current
                ? "border-transparent text-white"
                : "border-slate-200 dark:border-slate-700 text-slate-400"
            )}
            style={
              step <= current
                ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)" }
                : {}
            }
          >
            {step < current ? <CheckCircle2 className="w-4 h-4" /> : step}
          </div>
          {step < total && (
            <div
              className={clsx(
                "h-0.5 w-8 rounded transition-all",
                step < current ? "" : "bg-slate-200 dark:bg-slate-700"
              )}
              style={step < current ? { backgroundColor: "var(--accent)" } : {}}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Low-confidence warning dot ────────────────────────────────────────────────

function ConfidenceDot({ value }: { value: number }) {
  if (value >= 0.6) return null;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-1 align-middle"
      title="Low confidence — please verify"
    />
  );
}

// ─── Editable Class Card ───────────────────────────────────────────────────────

interface ClassCardProps {
  cls: EditableClass;
  index: number;
  onChange: (key: string, field: keyof EditableClass, value: unknown) => void;
  onRemove: (key: string) => void;
}

function ClassCard({ cls, index, onChange, onRemove }: ClassCardProps) {
  const toggleDay = (day: DayOfWeek) => {
    const next = cls.days.includes(day)
      ? cls.days.filter((d) => d !== day)
      : [...cls.days, day];
    onChange(cls._key, "days", next);
  };

  return (
    <div
      className="p-4 rounded-xl border space-y-3"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--muted-text)" }}
        >
          Class {index + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(cls._key)}
          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          aria-label="Remove class"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Subject Code */}
        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--muted-text)" }}>
            Subject Code <ConfidenceDot value={cls.confidence.subjectCode} />
          </label>
          <input
            type="text"
            value={cls.subjectCode}
            onChange={(e) => onChange(cls._key, "subjectCode", e.target.value)}
            placeholder="e.g. ITST 306"
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-muted)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Subject Name */}
        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--muted-text)" }}>
            Subject Name <ConfidenceDot value={cls.confidence.subjectName} />
          </label>
          <input
            type="text"
            value={cls.subjectName}
            onChange={(e) => onChange(cls._key, "subjectName", e.target.value)}
            placeholder="e.g. UX/UI Applications"
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-muted)",
              color: "var(--foreground)",
            }}
          />
        </div>
      </div>

      {/* Days */}
      <div>
        <label className="text-[11px] font-semibold block mb-1.5" style={{ color: "var(--muted-text)" }}>
          Days <ConfidenceDot value={cls.confidence.days} />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={clsx(
                "px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors",
                cls.days.includes(day)
                  ? "text-white border-transparent"
                  : "border-current"
              )}
              style={
                cls.days.includes(day)
                  ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-text)" }
                  : { color: "var(--muted-text)", borderColor: "var(--border)" }
              }
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Start Time */}
        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--muted-text)" }}>
            Start Time <ConfidenceDot value={cls.confidence.startTime} />
          </label>
          <input
            type="time"
            value={cls.startTime}
            onChange={(e) => onChange(cls._key, "startTime", e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-muted)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* End Time */}
        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--muted-text)" }}>
            End Time <ConfidenceDot value={cls.confidence.endTime} />
          </label>
          <input
            type="time"
            value={cls.endTime}
            onChange={(e) => onChange(cls._key, "endTime", e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-muted)",
              color: "var(--foreground)",
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Room */}
        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--muted-text)" }}>
            Room <ConfidenceDot value={cls.confidence.room} />
          </label>
          <input
            type="text"
            value={cls.room}
            onChange={(e) => onChange(cls._key, "room", e.target.value)}
            placeholder="Not detected — optional"
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-muted)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Instructor */}
        <div>
          <label className="text-[11px] font-semibold block mb-1" style={{ color: "var(--muted-text)" }}>
            Instructor <ConfidenceDot value={cls.confidence.instructor} />
          </label>
          <input
            type="text"
            value={cls.instructor}
            onChange={(e) => onChange(cls._key, "instructor", e.target.value)}
            placeholder="Not detected"
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 transition-colors"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-muted)",
              color: "var(--foreground)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal Component ──────────────────────────────────────────────────────

interface ScheduleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: string;
}

export function ScheduleImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ScheduleImportModalProps) {
  const { addSemester, importScheduleBatch } = useAcademicStore();
  const { subjects, addSubject } = useStudyStore();

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>(1);
  const [method, setMethod] = useState<ImportMethod>("paste");

  // Step 2
  const [pasteText, setPasteText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3
  const [classes, setClasses] = useState<EditableClass[]>([]);

  // Step 4
  const [semesterName, setSemesterName] = useState("1st Semester AY 2026–2027");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ subjects: number; events: number } | null>(null);

  // Duplicate resolution
  const [duplicates, setDuplicates] = useState<DuplicateResolution[]>([]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const resetWizard = useCallback(() => {
    setStep(1);
    setMethod("paste");
    setPasteText("");
    setIsParsing(false);
    setParseError(false);
    setClasses([]);
    setSemesterName("1st Semester AY 2026–2027");
    setStartDate("");
    setEndDate("");
    setIsImporting(false);
    setImportResult(null);
    setDuplicates([]);
  }, []);

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  // ── Step 1 handlers ───────────────────────────────────────────────────────

  const handleMethodSelect = (m: ImportMethod) => {
    setMethod(m);
    if (m === "manual") {
      setClasses([blankClass()]);
      setStep(3);
    } else if (m === "file") {
      // Trigger hidden file input
      fileInputRef.current?.click();
    } else {
      setStep(2);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Simulate: treat file name as paste content hint, read as text
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setPasteText(text || `File: ${file.name}`);
      setStep(2);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Step 2 handlers ───────────────────────────────────────────────────────

  const handleParse = async () => {
    if (!pasteText.trim()) return;
    setIsParsing(true);
    setParseError(false);

    // Simulate 800ms processing
    await new Promise((r) => setTimeout(r, 800));

    const parsed = parseScheduleText(pasteText);
    setIsParsing(false);

    if (parsed.length === 0) {
      setParseError(true);
      return;
    }

    setClasses(parsed.map(parsedToEditable));
    setStep(3);
  };

  // ── Step 3 handlers ───────────────────────────────────────────────────────

  const handleClassChange = (key: string, field: keyof EditableClass, value: unknown) => {
    setClasses((prev) =>
      prev.map((c) => (c._key === key ? { ...c, [field]: value } : c))
    );
  };

  const handleClassRemove = (key: string) => {
    setClasses((prev) => prev.filter((c) => c._key !== key));
  };

  const handleAddClass = () => {
    setClasses((prev) => [...prev, blankClass()]);
  };

  // ── Step 4 handlers ───────────────────────────────────────────────────────

  const handleImport = async () => {
    const validClasses = classes.filter((c) => c.subjectCode.trim());
    if (validClasses.length === 0) return;

    setIsImporting(true);

    // Detect duplicates
    const newDuplicates: DuplicateResolution[] = [];
    for (const cls of validClasses) {
      const existing = subjects.find(
        (s) => s.code.trim().toLowerCase() === cls.subjectCode.trim().toLowerCase()
      );
      if (existing) {
        newDuplicates.push({
          code: cls.subjectCode,
          existingSubject: existing,
          useExisting: null,
        });
      }
    }

    if (newDuplicates.length > 0) {
      setDuplicates(newDuplicates);
      setIsImporting(false);
      return; // wait for user to resolve duplicates
    }

    await performImport(validClasses, {});
  };

  const allDuplicatesResolved = duplicates.every((d) => d.useExisting !== null);

  const handleResolveDuplicate = (code: string, useExisting: boolean) => {
    setDuplicates((prev) =>
      prev.map((d) => (d.code === code ? { ...d, useExisting } : d))
    );
  };

  const handleConfirmDuplicates = async () => {
    if (!allDuplicatesResolved) return;
    setIsImporting(true);

    const subjectIdMap: Record<string, string> = {};
    for (const dup of duplicates) {
      if (dup.useExisting) {
        subjectIdMap[dup.code] = dup.existingSubject.id;
      }
    }

    const validClasses = classes.filter((c) => c.subjectCode.trim());
    await performImport(validClasses, subjectIdMap);
  };

  const performImport = async (
    validClasses: EditableClass[],
    existingSubjectIdMap: Record<string, string>
  ) => {
    // Create semester
    const semester = addSemester({
      userId: subjects[0]?.userId || "user",
      name: semesterName,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      isActive: true,
      isArchived: false,
    });

    // Create new subjects for classes not using existing
    const subjectIdMap: Record<string, string> = { ...existingSubjectIdMap };
    let newSubjectCount = 0;

    for (const cls of validClasses) {
      if (!subjectIdMap[cls.subjectCode]) {
        // Check if we should skip duplicate creation (useExisting = false means create separate)
        const dupEntry = duplicates.find((d) => d.code === cls.subjectCode);
        if (dupEntry?.useExisting === true) continue;

        const newSubj = addSubject({
          code: cls.subjectCode,
          name: cls.subjectName || cls.subjectCode,
          userId: semester.userId,
        });
        subjectIdMap[cls.subjectCode] = newSubj.id;
        newSubjectCount++;
      }
    }

    // Import batch
    const parsedForImport: import("@/lib/types").ParsedClass[] = validClasses.map((c) => ({
      subjectCode: c.subjectCode,
      subjectName: c.subjectName,
      days: c.days,
      startTime: c.startTime,
      endTime: c.endTime,
      room: c.room,
      instructor: c.instructor,
      section: c.section,
      confidence: c.confidence,
    }));

    const result = importScheduleBatch(parsedForImport, semester.id, semester, subjectIdMap);

    setImportResult({
      subjects: newSubjectCount,
      events: result.events.length,
    });
    setIsImporting(false);
  };

  const handleSuccessClose = () => {
    handleClose();
    onSuccess?.();
  };

  // ── Render guard ──────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf,.docx,.csv"
        className="sr-only"
        onChange={handleFileChange}
      />

      <div
        className="relative w-full max-w-2xl my-4 mx-4 sm:my-10 rounded-2xl shadow-2xl border"
        style={{
          backgroundColor: "var(--background)",
          borderColor: "var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-6 pb-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            {step > 1 && !importResult && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as WizardStep)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
                aria-label="Go back"
              >
                <ChevronLeft className="w-4 h-4" style={{ color: "var(--muted-text)" }} />
              </button>
            )}
            <GraduationCap className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
              {step === 1 && "Import Class Schedule"}
              {step === 2 && "Paste Your Schedule"}
              {step === 3 && "Review Detected Classes"}
              {step === 4 && "Name Your Semester"}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" style={{ color: "var(--muted-text)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-4">
          <StepIndicator current={step} total={4} />

          {/* ─── Step 1: Choose Method ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center my-1">
                <Character
                  character="toby"
                  expression="studying"
                  size="md"
                  speechBubble="I'll organize your timetable and classes!"
                  bubblePosition="top"
                />
              </div>

              <p className="text-xs text-center mb-3" style={{ color: "var(--muted-text)" }}>
                How would you like to add your class schedule?
              </p>

              {[
                {
                  id: "paste" as ImportMethod,
                  icon: FileText,
                  title: "Paste Text",
                  desc: "Copy from your student portal, enrollment form, or any text with your class schedule.",
                },
                {
                  id: "file" as ImportMethod,
                  icon: Upload,
                  title: "Upload File",
                  desc: "Upload a .txt, .csv, or document file containing your schedule.",
                },
                {
                  id: "manual" as ImportMethod,
                  icon: PlusCircle,
                  title: "Manual Entry",
                  desc: "Add each class manually with full control over every field.",
                },
              ].map(({ id, icon: Icon, title, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleMethodSelect(id)}
                  className={clsx(
                    "w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-sm active:scale-[0.99]",
                    method === id ? "ring-2" : ""
                  )}
                  style={{
                    borderColor: method === id ? "var(--accent)" : "var(--border)",
                    backgroundColor: "var(--surface)",
                    ...(method === id ? { ringColor: "var(--accent)" } : {}),
                  }}
                >
                  <div
                    className="p-2.5 rounded-lg shrink-0"
                    style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-text)" }}>
                      {desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ─── Step 2: Paste & Parse ─────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label
                  className="text-xs font-semibold block mb-1.5"
                  style={{ color: "var(--foreground)" }}
                >
                  Paste your schedule text here
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => {
                    setPasteText(e.target.value);
                    setParseError(false);
                  }}
                  placeholder={`Example:\nITST 306 UX/UI and Cross Platform Applications\nMWF 10:30AM - 12:00PM\nRoom: B204\nInstructor: Prof. Santos\n\nCS 201 Data Structures\nTTh 1:00PM - 2:30PM\nRoom: Lab 3`}
                  rows={10}
                  className="w-full text-xs p-3 rounded-xl border resize-none focus:outline-none focus:ring-2 transition-colors font-mono"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-muted)",
                    color: "var(--foreground)",
                  }}
                />
                <p className="text-[11px] mt-1.5" style={{ color: "var(--muted-text)" }}>
                  Copy from your student portal, enrollment form, or any text with your class schedule.
                </p>
              </div>

              {parseError && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      Couldn't detect any subjects.
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                      Try rephrasing or adding subject codes (e.g. ITST 306), or switch to Manual Entry.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setClasses([blankClass()]);
                        setStep(3);
                      }}
                      className="text-xs font-semibold text-amber-800 dark:text-amber-300 underline mt-1"
                    >
                      Manual Entry instead →
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleParse}
                disabled={!pasteText.trim() || isParsing}
                className={clsx(
                  "w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                  !pasteText.trim() || isParsing ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                )}
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Detecting subjects…
                  </>
                ) : (
                  "Parse Schedule"
                )}
              </button>
            </div>
          )}

          {/* ─── Step 3: Review & Edit ─────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs" style={{ color: "var(--muted-text)" }}>
                Check and correct the information below before saving.{" "}
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Yellow dot = low confidence field
                </span>
              </p>

              {classes.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: "var(--muted-text)" }}>
                  No classes added yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 -mr-1">
                  {classes.map((cls, idx) => (
                    <ClassCard
                      key={cls._key}
                      cls={cls}
                      index={idx}
                      onChange={handleClassChange}
                      onRemove={handleClassRemove}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddClass}
                className="w-full py-2.5 rounded-xl border-2 border-dashed text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                style={{ borderColor: "var(--border)", color: "var(--muted-text)" }}
              >
                <PlusCircle className="w-4 h-4" />
                Add Subject
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={classes.length === 0}
                className={clsx(
                  "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
                  classes.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                )}
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
              >
                Continue ({classes.filter((c) => c.subjectCode).length} classes) →
              </button>
            </div>
          )}

          {/* ─── Step 4: Confirm Semester ──────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Success state */}
              {importResult && (
                <div className="text-center py-8 space-y-3 animate-fade-in">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "var(--accent-light)" }}
                  >
                    <CheckCircle2 className="w-8 h-8" style={{ color: "var(--accent)" }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                      Schedule Imported!
                    </h3>
                    <p className="text-xs mt-1" style={{ color: "var(--muted-text)" }}>
                      ✓ {importResult.subjects} subject{importResult.subjects !== 1 ? "s" : ""} created.
                      Calendar updated with {importResult.events} recurring class
                      {importResult.events !== 1 ? "es" : ""}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSuccessClose}
                    className="px-6 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Duplicate resolution */}
              {!importResult && duplicates.length > 0 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      Duplicate subjects detected
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      Some subjects already exist in your library. Choose how to handle each:
                    </p>
                  </div>
                  {duplicates.map((dup) => (
                    <div
                      key={dup.code}
                      className="p-3.5 rounded-xl border space-y-2"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
                    >
                      <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5"
                          style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}
                        >
                          {dup.code}
                        </span>
                        already exists
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolveDuplicate(dup.code, true)}
                          className={clsx(
                            "flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all",
                            dup.useExisting === true
                              ? "text-white border-transparent"
                              : "border-current hover:opacity-80"
                          )}
                          style={
                            dup.useExisting === true
                              ? { backgroundColor: "var(--accent)", color: "var(--accent-text)", borderColor: "var(--accent)" }
                              : { color: "var(--accent)", borderColor: "var(--accent)" }
                          }
                        >
                          Use Existing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveDuplicate(dup.code, false)}
                          className={clsx(
                            "flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all",
                            dup.useExisting === false
                              ? "border-slate-600 bg-slate-600 text-white"
                              : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:opacity-80"
                          )}
                        >
                          Create Separate
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleConfirmDuplicates}
                    disabled={!allDuplicatesResolved || isImporting}
                    className={clsx(
                      "w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                      !allDuplicatesResolved || isImporting ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                    )}
                    style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing…
                      </>
                    ) : (
                      "Confirm & Import"
                    )}
                  </button>
                </div>
              )}

              {/* Normal import form */}
              {!importResult && duplicates.length === 0 && (
                <>
                  <div>
                    <label
                      className="text-xs font-semibold block mb-1.5"
                      style={{ color: "var(--foreground)" }}
                    >
                      Semester Name
                    </label>
                    <input
                      type="text"
                      value={semesterName}
                      onChange={(e) => setSemesterName(e.target.value)}
                      placeholder="1st Semester AY 2026–2027"
                      className="w-full text-sm px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-colors"
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: "var(--surface-muted)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className="text-xs font-semibold block mb-1.5"
                        style={{ color: "var(--foreground)" }}
                      >
                        Start Date <span style={{ color: "var(--muted-text)" }}>(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-colors"
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: "var(--surface-muted)",
                          color: "var(--foreground)",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="text-xs font-semibold block mb-1.5"
                        style={{ color: "var(--foreground)" }}
                      >
                        End Date <span style={{ color: "var(--muted-text)" }}>(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-colors"
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: "var(--surface-muted)",
                          color: "var(--foreground)",
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px]" style={{ color: "var(--muted-text)" }}>
                    Dates determine how long recurring classes appear on your calendar.
                    Leave blank for 16 weeks from today.
                  </p>

                  {/* Summary */}
                  <div
                    className="p-3 rounded-xl border"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-muted)" }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-text)" }}>
                      Import Summary
                    </p>
                    <p className="text-xs" style={{ color: "var(--foreground)" }}>
                      {classes.filter((c) => c.subjectCode).length} classes will be imported
                      {semesterName ? ` into "${semesterName}"` : ""}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!semesterName.trim() || isImporting}
                    className={clsx(
                      "w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                      !semesterName.trim() || isImporting ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
                    )}
                    style={{ backgroundColor: "var(--accent)", color: "var(--accent-text)" }}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing…
                      </>
                    ) : (
                      "Confirm & Import"
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
