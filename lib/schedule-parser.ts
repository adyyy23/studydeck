import { ParsedClass, DayOfWeek } from "./types";

/**
 * Heuristic schedule text parser.
 * NEVER fabricates missing information — blank fields it cannot detect with confidence.
 */

// Patterns
const SUBJECT_CODE_RE = /\b([A-Z]{2,6})\s*[\s_-]?\s*(\d{2,4}[A-Z]?)\b/g;
const TIME_RE = /(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*[-–—to]+\s*(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi;
const TIME_24_RE = /(\d{1,2}:\d{2})\s*[-–—]+\s*(\d{1,2}:\d{2})/g;
const ROOM_RE = /(?:room|rm\.?|lab)\s*[:\-]?\s*([A-Z0-9][\w\-]*)/gi;
const INSTRUCTOR_RE =
  /(?:instructor|prof(?:essor)?|teacher|faculty|mr\.|mrs\.|ms\.|dr\.)\s*[:\-]?\s*([A-Za-z\s.]+?)(?:\n|$|,)/gi;
const SECTION_RE = /(?:section|sec\.?|grp\.?|group)\s*[:\-]?\s*([A-Z0-9\-]+)/gi;

const DAY_PATTERNS: { pattern: RegExp; days: DayOfWeek[] }[] = [
  { pattern: /\b(MTWTh|MTWTH)\b/gi, days: ["Mon", "Tue", "Wed", "Thu"] },
  { pattern: /\b(MWF)\b/g, days: ["Mon", "Wed", "Fri"] },
  { pattern: /\b(TTh|TTH|TuTh|TuTH)\b/g, days: ["Tue", "Thu"] },
  { pattern: /\b(MW)\b/g, days: ["Mon", "Wed"] },
  { pattern: /\b(TF|WF)\b/g, days: ["Tue", "Fri"] },
  { pattern: /\bMonday(?:\s*and\s*Wednesday)?\b/gi, days: ["Mon"] },
  { pattern: /\bTuesday(?:\s*and\s*Thursday)?\b/gi, days: ["Tue"] },
  { pattern: /\bWednesday\b/gi, days: ["Wed"] },
  { pattern: /\bThursday\b/gi, days: ["Thu"] },
  { pattern: /\bFriday\b/gi, days: ["Fri"] },
  { pattern: /\bSaturday\b/gi, days: ["Sat"] },
  { pattern: /\bSunday\b/gi, days: ["Sun"] },
  { pattern: /\bMon\b/gi, days: ["Mon"] },
  { pattern: /\bTue\b/gi, days: ["Tue"] },
  { pattern: /\bWed\b/gi, days: ["Wed"] },
  { pattern: /\bThu\b/gi, days: ["Thu"] },
  { pattern: /\bFri\b/gi, days: ["Fri"] },
  { pattern: /\bSat\b/gi, days: ["Sat"] },
  { pattern: /\bSun\b/gi, days: ["Sun"] },
];

function normalizeTime(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  // Already HH:mm
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;

  // Parse 12h
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return "";
  let hours = parseInt(match[1], 10);
  const mins = match[2];
  const period = match[3];
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${mins}`;
}

function extractDays(text: string): DayOfWeek[] {
  const found: DayOfWeek[] = [];
  const seen = new Set<DayOfWeek>();
  for (const { pattern, days } of DAY_PATTERNS) {
    if (pattern.test(text)) {
      for (const d of days) {
        if (!seen.has(d)) {
          seen.add(d);
          found.push(d);
        }
      }
    }
    pattern.lastIndex = 0; // reset stateful regex
  }
  return found;
}

/**
 * Split a block of schedule text into per-subject chunks.
 * Heuristic: a new subject starts when we see a subject code pattern.
 */
function splitIntoBlocks(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const blocks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }
      continue;
    }
    current.push(trimmed);
  }
  if (current.length > 0) blocks.push(current.join("\n"));

  return blocks.filter((b) => b.trim().length > 2);
}

export function parseScheduleText(text: string): ParsedClass[] {
  if (!text.trim()) return [];

  // Try to split into blocks — if text has clear subject separators use them
  const blocks = splitIntoBlocks(text);
  const results: ParsedClass[] = [];

  // Collect all subject codes from full text first
  const allCodes: Array<{ code: string; name: string; pos: number }> = [];
  {
    let m: RegExpExecArray | null;
    const re = new RegExp(SUBJECT_CODE_RE.source, "g");
    while ((m = re.exec(text)) !== null) {
      allCodes.push({
        code: `${m[1]} ${m[2]}`,
        name: "",
        pos: m.index,
      });
    }
  }

  // Process each block
  for (const block of blocks) {
    // --- Subject code ---
    let subjectCode = "";
    let codeConfidence = 0;
    {
      const re = new RegExp(SUBJECT_CODE_RE.source, "g");
      const m = re.exec(block);
      if (m) {
        subjectCode = `${m[1]} ${m[2]}`;
        codeConfidence = 0.9;
      }
    }

    if (!subjectCode) continue; // Can't do anything without a code

    // --- Subject name ---
    // Name is usually the line after the code, without digits
    let subjectName = "";
    let nameConfidence = 0;
    {
      const lines = block.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes(subjectCode.replace(" ", "")) || line.match(/^[A-Z]{2,6}\s*\d{3}/)) {
          // Check next line for a name-like string
          if (i + 1 < lines.length) {
            const next = lines[i + 1].trim();
            // A subject name usually has > 4 chars, no pure digits, not a day pattern
            if (
              next.length > 4 &&
              !/^\d+$/.test(next) &&
              !/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|MTW|MWF|TTh)/i.test(next) &&
              !/^\d{1,2}:\d{2}/.test(next)
            ) {
              subjectName = next;
              nameConfidence = 0.7;
            }
          }
          break;
        }
      }
      // Fallback: look for a longer phrase after the code on the same line
      if (!subjectName) {
        const afterCode = block.replace(new RegExp(`[A-Z]{2,6}\\s*\\d{2,4}[A-Z]?`), "").trim();
        const firstLine = afterCode.split("\n")[0].trim();
        if (firstLine.length > 4 && !/^\d/.test(firstLine) && !/^(Mon|Tue|Wed)/i.test(firstLine)) {
          subjectName = firstLine;
          nameConfidence = 0.5;
        }
      }
    }

    // --- Days ---
    const days = extractDays(block);
    const daysConfidence = days.length > 0 ? 0.85 : 0;

    // --- Time ---
    let startTime = "";
    let endTime = "";
    let timeConfidence = 0;
    {
      const reTime = new RegExp(TIME_RE.source, "gi");
      const m = reTime.exec(block);
      if (m) {
        startTime = normalizeTime(m[1]);
        endTime = normalizeTime(m[2]);
        timeConfidence = startTime ? 0.9 : 0;
      } else {
        // Try 24h
        const re24 = new RegExp(TIME_24_RE.source, "g");
        const m2 = re24.exec(block);
        if (m2) {
          startTime = normalizeTime(m2[1]);
          endTime = normalizeTime(m2[2]);
          timeConfidence = 0.8;
        }
      }
    }

    // --- Room ---
    let room = "";
    let roomConfidence = 0;
    {
      const reRoom = new RegExp(ROOM_RE.source, "gi");
      const m = reRoom.exec(block);
      if (m) {
        room = m[1].trim();
        roomConfidence = 0.8;
      }
    }

    // --- Instructor ---
    let instructor = "";
    let instrConfidence = 0;
    {
      const reInstr = new RegExp(INSTRUCTOR_RE.source, "gi");
      const m = reInstr.exec(block);
      if (m) {
        instructor = m[1].trim();
        instrConfidence = 0.75;
      }
    }

    // --- Section ---
    let section = "";
    {
      const reSec = new RegExp(SECTION_RE.source, "gi");
      const m = reSec.exec(block);
      if (m) section = m[1].trim();
    }

    results.push({
      subjectCode,
      subjectName,
      days,
      startTime,
      endTime,
      room,
      instructor,
      section,
      confidence: {
        subjectCode: codeConfidence,
        subjectName: nameConfidence,
        days: daysConfidence,
        startTime: timeConfidence,
        endTime: timeConfidence,
        room: roomConfidence,
        instructor: instrConfidence,
      },
    });
  }

  // Deduplicate by subject code (keep first occurrence)
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.subjectCode)) return false;
    seen.add(r.subjectCode);
    return true;
  });
}

/**
 * Parse module/material content to detect structure.
 * Returns { moduleTitle, topics[] }
 */
export function parseModuleContent(text: string): {
  moduleTitle: string;
  topics: string[];
  confidence: number;
} {
  if (!text.trim()) return { moduleTitle: "", topics: [], confidence: 0 };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Module title: first line matching "Module N" or "Chapter N" or a bold-looking header
  let moduleTitle = "";
  const moduleTitleRe = /^(Module|Chapter|Unit|Lesson)\s*\d+[\s:\-–]*(.*)/i;
  for (const line of lines.slice(0, 5)) {
    const m = line.match(moduleTitleRe);
    if (m) {
      moduleTitle = m[0].trim();
      break;
    }
  }
  if (!moduleTitle && lines[0]) moduleTitle = lines[0];

  // Topics: lines that look like headings
  // Patterns: all-caps short lines, numbered items, lines after "Topics:" or "Objectives:"
  const topicPatterns = [
    /^\d+[\.\)]\s+(.+)/, // 1. Topic
    /^[IVX]+\.\s+(.+)/, // Roman numerals
    /^[A-Z][A-Z\s]{4,}$/, // ALL CAPS
    /^#{1,3}\s+(.+)/, // Markdown headings
    /^[-•*]\s+(.+)/, // Bullet points
  ];

  const topics: string[] = [];
  let inTopicsSection = false;

  for (const line of lines) {
    if (/^(topics|objectives|learning outcomes|agenda|contents?)[\s:]*/i.test(line)) {
      inTopicsSection = true;
      continue;
    }
    if (line === moduleTitle) continue;

    for (const pat of topicPatterns) {
      const m = line.match(pat);
      if (m) {
        const topic = (m[1] || m[0]).trim();
        if (topic.length > 3 && topic.length < 120 && !topics.includes(topic)) {
          topics.push(topic);
        }
        break;
      }
    }

    // In topics section, grab any short non-empty line
    if (inTopicsSection && line.length > 3 && line.length < 120) {
      if (!topics.includes(line) && !topicPatterns.some((p) => p.test(line))) {
        topics.push(line);
      }
    }
  }

  // Cap at 12 topics
  const finalTopics = topics.slice(0, 12);
  const confidence = moduleTitle ? (finalTopics.length > 0 ? 0.75 : 0.5) : 0.3;

  return { moduleTitle, topics: finalTopics, confidence };
}
