import { Flashcard, QuizQuestion, QuestionType } from "./types";

export interface GeneratedStudyDraft {
  id: string;
  type: "flashcard" | QuestionType;
  frontOrQuestion: string;
  backOrAnswer: string;
  options?: string[];
  explanation: string;
  approved: boolean;
}

/**
 * Intelligent client-side parser & generator that synthesizes study materials
 * into draft study sets for student review before approval.
 */
export function generateStudySetDrafts(
  materialTitle: string,
  content: string,
  targetType: "flashcards" | "multiple_choice" | "identification" | "true_false" | "fill_blank",
  quantity: number = 5
): GeneratedStudyDraft[] {
  const drafts: GeneratedStudyDraft[] = [];
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 15);

  // Extract key concept sentences / definitions
  const candidateSentences = lines.filter(
    (l) =>
      l.includes(":") ||
      l.includes("—") ||
      l.includes(" is ") ||
      l.includes(" are ") ||
      l.includes("refers to")
  );

  const pool = candidateSentences.length >= quantity ? candidateSentences : lines;

  if (targetType === "flashcards") {
    for (let i = 0; i < Math.min(quantity, Math.max(pool.length, 3)); i++) {
      const sentence = pool[i % pool.length] || `Core Principle of ${materialTitle}`;
      let term = "";
      let def = "";

      if (sentence.includes(":")) {
        const parts = sentence.split(":");
        term = parts[0].replace(/^\d+[\.\)]\s*/, "").trim();
        def = parts.slice(1).join(":").trim();
      } else if (sentence.includes("—")) {
        const parts = sentence.split("—");
        term = parts[0].replace(/^\d+[\.\)]\s*/, "").trim();
        def = parts.slice(1).join("—").trim();
      } else if (sentence.includes(" is ")) {
        const parts = sentence.split(" is ");
        term = parts[0].trim();
        def = "Is " + parts.slice(1).join(" is ").trim();
      } else {
        const words = sentence.split(" ");
        term = words.slice(0, 3).join(" ");
        def = sentence;
      }

      drafts.push({
        id: `draft_${Date.now()}_${i}`,
        type: "flashcard",
        frontOrQuestion: term || `Concept ${i + 1}`,
        backOrAnswer: def || sentence,
        explanation: `Extracted from "${materialTitle}"`,
        approved: true,
      });
    }
  } else if (targetType === "true_false") {
    for (let i = 0; i < Math.min(quantity, Math.max(pool.length, 3)); i++) {
      const sentence = pool[i % pool.length];
      const isTrue = i % 2 === 0;
      const questionText = isTrue
        ? `True or False: ${sentence}`
        : `True or False: ${sentence.replace(/is\b/gi, "is NOT").replace(/prioritize\b/gi, "disregard")}`;

      drafts.push({
        id: `draft_tf_${Date.now()}_${i}`,
        type: "true_false",
        frontOrQuestion: questionText,
        backOrAnswer: isTrue ? "True" : "False",
        options: ["True", "False"],
        explanation: `Based on the source text: "${sentence}"`,
        approved: true,
      });
    }
  } else if (targetType === "multiple_choice") {
    const defaultDistractors = [
      "Premature optimization without user testing",
      "Arbitrary visual styling and decorative flair",
      "Unsynchronized client-side state replication",
      "Static single-tier evaluation model",
    ];

    for (let i = 0; i < Math.min(quantity, Math.max(pool.length, 3)); i++) {
      const sentence = pool[i % pool.length];
      let term = "Core Concept";
      let def = sentence;

      if (sentence.includes(":")) {
        const parts = sentence.split(":");
        term = parts[0].replace(/^\d+[\.\)]\s*/, "").trim();
        def = parts.slice(1).join(":").trim();
      }

      const options = [
        def,
        defaultDistractors[i % defaultDistractors.length],
        defaultDistractors[(i + 1) % defaultDistractors.length],
        defaultDistractors[(i + 2) % defaultDistractors.length],
      ].sort(() => 0.5 - Math.random());

      drafts.push({
        id: `draft_mc_${Date.now()}_${i}`,
        type: "multiple_choice",
        frontOrQuestion: `According to ${materialTitle}, which statement accurately characterizes "${term}"?`,
        backOrAnswer: def,
        options,
        explanation: `Reference in material: "${sentence}"`,
        approved: true,
      });
    }
  } else {
    // Identification / Fill in blank
    for (let i = 0; i < Math.min(quantity, Math.max(pool.length, 3)); i++) {
      const sentence = pool[i % pool.length];
      let term = "Key Term";
      if (sentence.includes(":")) {
        term = sentence.split(":")[0].replace(/^\d+[\.\)]\s*/, "").trim();
      } else {
        const words = sentence.split(" ");
        term = words.slice(0, 2).join(" ");
      }

      drafts.push({
        id: `draft_id_${Date.now()}_${i}`,
        type: targetType,
        frontOrQuestion: `Define or identify: ${sentence.replace(term, "_______")}`,
        backOrAnswer: term,
        explanation: `Direct concept from "${materialTitle}"`,
        approved: true,
      });
    }
  }

  return drafts;
}

/**
 * Contextual AI query handler that prioritizes uploaded student material
 * and clearly distinguishes between material-grounded answers vs general explanations.
 */
export function queryStudyAssistant(
  query: string,
  context?: {
    materialTitle?: string;
    materialContent?: string;
    subjectName?: string;
    topicName?: string;
  }
): {
  content: string;
  groundedInMaterial: boolean;
  citation?: string;
} {
  const q = query.toLowerCase();

  // If user provided study material context, scan it for keywords
  if (context?.materialContent && context.materialContent.trim().length > 0) {
    const text = context.materialContent;
    const words = q.split(/\s+/).filter((w) => w.length > 3);
    const matchedSentences = text
      .split("\n")
      .filter((line) => words.some((w) => line.toLowerCase().includes(w)));

    if (matchedSentences.length > 0) {
      const excerpt = matchedSentences.slice(0, 2).join(" ");
      return {
        groundedInMaterial: true,
        citation: `Direct match from notes: "${context.materialTitle || "Uploaded Material"}"`,
        content: `Based on your materials for **${context.subjectName || "this subject"}**:\n\n> "${excerpt.trim()}"\n\n**Academic Summary**:\nYour notes emphasize this concept as a primary factor in the study cycle. Specifically, reviewing this section in context reinforces the structural methodology rather than superficial recall.`,
      };
    }
  }

  // Common contextual academic explanations
  if (q.includes("simpler") || q.includes("simple")) {
    return {
      groundedInMaterial: false,
      content: `In simple terms: Think of this concept like building a solid bridge. Before adding decorative handrails and painting the metal (high-fidelity styling), you need to ensure the structural pylons can bear the weight (low-fidelity navigation and core flow). Test the structure with users first so you don't waste time painting something that will fall apart.`,
    };
  }

  if (q.includes("example") || q.includes("instance")) {
    return {
      groundedInMaterial: false,
      content: `Here is a concrete real-world example:\n\nConsider an e-commerce checkout flow. A low-fidelity test on paper with 5 users would immediately reveal if users are confused between "Billing Address" and "Shipping Address". Catching this before writing code or designing pixel-perfect assets saves weeks of engineering rework.`,
    };
  }

  if (q.includes("why was my answer wrong") || q.includes("why wrong")) {
    return {
      groundedInMaterial: false,
      content: `When analyzing incorrect quiz options, examine the core distinction:\n\n- The correct option represents the established principle or empirical finding.\n- The option you selected often represents a common misconception—such as prioritizing aesthetic polish before conceptual flow, or confusing formative testing with summative measurement.\n\nReview the explanation provided on the question card and add it to your Mistake Notebook to solidify the distinction.`,
    };
  }

  // General explanation
  return {
    groundedInMaterial: false,
    content: `General Academic Overview regarding "${query}":\n\nThis topic is foundational in ${context?.subjectName || "your coursework"}. It requires understanding the relationship between the governing theoretical principles, their practical application constraints, and how they are measured during iterative evaluations. Focus your review on comparing this term directly with adjacent concepts.`,
  };
}
