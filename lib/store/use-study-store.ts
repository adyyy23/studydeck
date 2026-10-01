import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Subject,
  Module,
  Topic,
  StudyMaterial,
  Flashcard,
  Quiz,
  QuizAttempt,
  MistakeItem,
  Rating,
  SubjectColor,
  SubjectIcon,
} from "../types";
import { calculateNextReview } from "../spaced-repetition";

interface StudyState {
  subjects: Subject[];
  modules: Module[];
  topics: Topic[];
  materials: StudyMaterial[];
  flashcards: Flashcard[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  mistakes: MistakeItem[];

  // Subject Actions
  addSubject: (data: { code: string; name: string; description?: string; color?: SubjectColor; icon?: SubjectIcon; userId: string }) => Subject;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  archiveSubject: (id: string) => void;

  // Module & Topic Actions
  addModule: (subjectId: string, title: string) => Module;
  deleteModule: (id: string) => void;
  addTopic: (moduleId: string, subjectId: string, title: string) => Topic;
  deleteTopic: (id: string) => void;

  // Material Actions
  addMaterial: (data: Omit<StudyMaterial, "id" | "createdAt" | "updatedAt">) => StudyMaterial;
  updateMaterial: (id: string, data: Partial<StudyMaterial>) => void;
  deleteMaterial: (id: string) => void;

  // Flashcard Actions
  addFlashcard: (data: Omit<Flashcard, "id" | "createdAt" | "intervalDays" | "easeFactor" | "repetitions" | "state" | "nextReviewDate">) => Flashcard;
  addBatchFlashcards: (cards: Array<Omit<Flashcard, "id" | "createdAt" | "intervalDays" | "easeFactor" | "repetitions" | "state" | "nextReviewDate">>) => void;
  reviewCard: (cardId: string, rating: Rating) => void;
  deleteFlashcard: (id: string) => void;

  // Quiz Actions
  addQuiz: (data: Omit<Quiz, "id" | "createdAt">) => Quiz;
  recordQuizAttempt: (attempt: Omit<QuizAttempt, "id" | "completedAt">) => QuizAttempt;
  deleteQuiz: (id: string) => void;

  // Mistake Notebook Actions
  recordMistake: (data: {
    userId: string;
    subjectId: string;
    moduleId?: string;
    topicId?: string;
    questionId: string;
    questionText: string;
    lastUserAnswer: string;
    correctAnswer: string;
    explanation: string;
  }) => void;
  reviewMistakeAttempt: (mistakeId: string, isCorrect: boolean) => void;
  removeMistake: (mistakeId: string) => void;

  // Game result recording (lower mastery weight: 0.3×)
  recordGameResult: (data: {
    userId: string;
    subjectId?: string;
    gameType: string;
    accuracy: number;
    score: number;
    streak: number;
    durationSeconds: number;
    mistakes?: Array<{ questionText: string; userAnswer: string; correctAnswer: string; explanation?: string }>;
  }) => void;

  // Helper to load sample curriculum for ITST 306
  loadSampleITST306Curriculum: (userId: string) => void;
  resetAllStudyData: () => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      subjects: [],
      modules: [],
      topics: [],
      materials: [],
      flashcards: [],
      quizzes: [],
      quizAttempts: [],
      mistakes: [],

      addSubject: ({ code, name, description, color = "cobalt", icon, userId }) => {
        const newSubject: Subject = {
          id: `subj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId,
          code,
          name,
          description,
          color,
          icon,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ subjects: [...state.subjects, newSubject] }));
        return newSubject;
      },

      updateSubject: (id, data) => {
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
          ),
        }));
      },

      deleteSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== id),
          modules: state.modules.filter((m) => m.subjectId !== id),
          topics: state.topics.filter((t) => t.subjectId !== id),
          materials: state.materials.filter((mat) => mat.subjectId !== id),
          flashcards: state.flashcards.filter((f) => f.subjectId !== id),
          quizzes: state.quizzes.filter((q) => q.subjectId !== id),
          mistakes: state.mistakes.filter((m) => m.subjectId !== id),
        }));
      },

      archiveSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === id ? { ...s, isArchived: !s.isArchived } : s
          ),
        }));
      },

      addModule: (subjectId, title) => {
        const currentModules = get().modules.filter((m) => m.subjectId === subjectId);
        const newModule: Module = {
          id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          subjectId,
          title,
          order: currentModules.length + 1,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ modules: [...state.modules, newModule] }));
        return newModule;
      },

      deleteModule: (id) => {
        set((state) => ({
          modules: state.modules.filter((m) => m.id !== id),
          topics: state.topics.filter((t) => t.moduleId !== id),
        }));
      },

      addTopic: (moduleId, subjectId, title) => {
        const currentTopics = get().topics.filter((t) => t.moduleId === moduleId);
        const newTopic: Topic = {
          id: `top_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          moduleId,
          subjectId,
          title,
          order: currentTopics.length + 1,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ topics: [...state.topics, newTopic] }));
        return newTopic;
      },

      deleteTopic: (id) => {
        set((state) => ({
          topics: state.topics.filter((t) => t.id !== id),
        }));
      },

      addMaterial: (data) => {
        const newMaterial: StudyMaterial = {
          ...data,
          id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ materials: [...state.materials, newMaterial] }));
        return newMaterial;
      },

      updateMaterial: (id, data) => {
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
          ),
        }));
      },

      deleteMaterial: (id) => {
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
        }));
      },

      addFlashcard: (data) => {
        const todayStr = new Date().toISOString().split("T")[0];
        const newCard: Flashcard = {
          ...data,
          id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          state: "new",
          nextReviewDate: todayStr,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ flashcards: [...state.flashcards, newCard] }));
        return newCard;
      },

      addBatchFlashcards: (cards) => {
        const todayStr = new Date().toISOString().split("T")[0];
        const created: Flashcard[] = cards.map((c, i) => ({
          ...c,
          id: `card_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          intervalDays: 0,
          easeFactor: 2.5,
          repetitions: 0,
          state: "new",
          nextReviewDate: todayStr,
          createdAt: new Date().toISOString(),
        }));
        set((state) => ({ flashcards: [...state.flashcards, ...created] }));
      },

      reviewCard: (cardId, rating) => {
        set((state) => ({
          flashcards: state.flashcards.map((card) => {
            if (card.id !== cardId) return card;
            const updated = calculateNextReview(card, rating);
            return {
              ...card,
              ...updated,
              lastReviewedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteFlashcard: (id) => {
        set((state) => ({
          flashcards: state.flashcards.filter((c) => c.id !== id),
        }));
      },

      addQuiz: (data) => {
        const newQuiz: Quiz = {
          ...data,
          id: `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ quizzes: [...state.quizzes, newQuiz] }));
        return newQuiz;
      },

      recordQuizAttempt: (attemptData) => {
        const attempt: QuizAttempt = {
          ...attemptData,
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          completedAt: new Date().toISOString(),
        };
        set((state) => ({ quizAttempts: [attempt, ...state.quizAttempts] }));
        return attempt;
      },

      deleteQuiz: (id) => {
        set((state) => ({
          quizzes: state.quizzes.filter((q) => q.id !== id),
        }));
      },

      recordMistake: (data) => {
        set((state) => {
          const existing = state.mistakes.find((m) => m.questionId === data.questionId);
          if (existing) {
            return {
              mistakes: state.mistakes.map((m) =>
                m.id === existing.id
                  ? {
                      ...m,
                      lastUserAnswer: data.lastUserAnswer,
                      attemptsCount: m.attemptsCount + 1,
                      consecutiveCorrect: 0,
                      state: "learning",
                      updatedAt: new Date().toISOString(),
                    }
                  : m
              ),
            };
          }

          const newMistake: MistakeItem = {
            id: `mistake_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: data.userId,
            subjectId: data.subjectId,
            moduleId: data.moduleId,
            topicId: data.topicId,
            questionId: data.questionId,
            questionText: data.questionText,
            lastUserAnswer: data.lastUserAnswer,
            correctAnswer: data.correctAnswer,
            explanation: data.explanation,
            attemptsCount: 1,
            consecutiveCorrect: 0,
            state: "learning",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return { mistakes: [newMistake, ...state.mistakes] };
        });
      },

      reviewMistakeAttempt: (mistakeId, isCorrect) => {
        set((state) => ({
          mistakes: state.mistakes.map((m) => {
            if (m.id !== mistakeId) return m;
            const newConsecutive = isCorrect ? m.consecutiveCorrect + 1 : 0;
            let newState = m.state;
            if (newConsecutive >= 2) {
              newState = "mastered";
            } else if (newConsecutive === 1) {
              newState = "improving";
            } else {
              newState = "learning";
            }

            return {
              ...m,
              consecutiveCorrect: newConsecutive,
              attemptsCount: m.attemptsCount + 1,
              state: newState,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      removeMistake: (mistakeId) => {
        set((state) => ({
          mistakes: state.mistakes.filter((m) => m.id !== mistakeId),
        }));
      },

      recordGameResult: ({ userId, subjectId, gameType, accuracy, score, streak, durationSeconds, mistakes: gameMistakes }) => {
        // Record each wrong answer into mistake notebook at lower weight
        if (gameMistakes && gameMistakes.length > 0) {
          set((state) => {
            let updatedMistakes = [...state.mistakes];
            for (const gm of gameMistakes) {
              const qId = `game_${gameType}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
              const existing = updatedMistakes.find(
                (m) => m.questionText === gm.questionText && m.subjectId === (subjectId ?? "")
              );
              if (existing) {
                // Update existing — game wrong answer increments attempts but doesn't heavily affect state
                updatedMistakes = updatedMistakes.map((m) =>
                  m.id === existing.id
                    ? {
                        ...m,
                        attemptsCount: m.attemptsCount + 1,
                        lastUserAnswer: gm.userAnswer,
                        consecutiveCorrect: 0,
                        updatedAt: new Date().toISOString(),
                      }
                    : m
                );
              } else {
                // New mistake from game — mark as game-sourced
                const newMistake: MistakeItem = {
                  id: `mis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  userId,
                  subjectId: subjectId ?? "",
                  questionId: qId,
                  questionText: gm.questionText,
                  lastUserAnswer: gm.userAnswer,
                  correctAnswer: gm.correctAnswer,
                  explanation: gm.explanation ?? "",
                  attemptsCount: 1,
                  consecutiveCorrect: 0,
                  state: "learning",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                updatedMistakes.push(newMistake);
              }
            }
            return { mistakes: updatedMistakes };
          });
        }
        // Note: session logging is done externally via useAcademicStore.logSession()
        // with gameMasteryWeight: 0.3 so games don't inflate mastery scores
      },

      loadSampleITST306Curriculum: (userId: string) => {
        const subjectId = `subj_itst306_${Date.now()}`;
        const newSubject: Subject = {
          id: subjectId,
          userId,
          code: "ITST 306",
          name: "UX/UI and Cross Platform Applications",
          description: "Principles of human-computer interaction, cross-platform interface design, and rapid prototyping workflows.",
          color: "cobalt",
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const mod1Id = `mod_1_${Date.now()}`;
        const mod2Id = `mod_2_${Date.now()}`;
        const modules: Module[] = [
          { id: mod1Id, subjectId, title: "Module 1: UX Fundamentals", order: 1, createdAt: new Date().toISOString() },
          { id: mod2Id, subjectId, title: "Module 2: Prototyping & Cross-Platform", order: 2, createdAt: new Date().toISOString() },
        ];

        const top1Id = `top_1_${Date.now()}`;
        const top2Id = `top_2_${Date.now()}`;
        const top3Id = `top_3_${Date.now()}`;
        const topics: Topic[] = [
          { id: top1Id, moduleId: mod1Id, subjectId, title: "Design Thinking & UX Research", order: 1, createdAt: new Date().toISOString() },
          { id: top2Id, moduleId: mod1Id, subjectId, title: "Heuristic Evaluation", order: 2, createdAt: new Date().toISOString() },
          { id: top3Id, moduleId: mod2Id, subjectId, title: "Prototyping & Usability Testing", order: 1, createdAt: new Date().toISOString() },
        ];

        const mat1Id = `mat_1_${Date.now()}`;
        const materials: StudyMaterial[] = [
          {
            id: mat1Id,
            userId,
            subjectId,
            moduleId: mod2Id,
            topicId: top3Id,
            title: "Prototyping Fidelity & Cross-Platform Design Notes",
            content: `PROTOTYPING AND FIDELITY OVERVIEW
High-fidelity prototypes simulate realistic visual design, interaction states, and platform-specific gestures.
Low-fidelity prototypes (such as paper sketches or wireframes) prioritize conceptual navigation and layout structure over aesthetics.
Cross-platform applications must balance shared UI component libraries with native ergonomics (such as iOS swipe-to-go-back and Android bottom-sheet navigation).

Key Principles:
1. Usability Testing: Conduct formative evaluations early in the sprint cycle with 5-8 users to uncover 85% of usability bottlenecks.
2. Affordance: The visual quality that communicates how an element can be interacted with. A button must look pressable.
3. System Status Visibility: The interface should always keep users informed about what is going on, through appropriate feedback within a reasonable time (Nielsen Heuristic 1).`,
            type: "note",
            wordCount: 142,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        const todayStr = new Date().toISOString().split("T")[0];
        const flashcards: Flashcard[] = [
          {
            id: `card_1_${Date.now()}`,
            userId,
            subjectId,
            moduleId: mod2Id,
            topicId: top3Id,
            materialId: mat1Id,
            front: "High-Fidelity Prototype",
            back: "A prototype that closely simulates the look, feel, response time, and detailed interactions of the finished software system.",
            type: "term_def",
            state: "new",
            intervalDays: 0,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: todayStr,
            createdAt: new Date().toISOString(),
          },
          {
            id: `card_2_${Date.now()}`,
            userId,
            subjectId,
            moduleId: mod2Id,
            topicId: top3Id,
            materialId: mat1Id,
            front: "Affordance",
            back: "The physical or visual properties of an object that intuitively indicate how it can or should be used.",
            type: "term_def",
            state: "new",
            intervalDays: 0,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: todayStr,
            createdAt: new Date().toISOString(),
          },
          {
            id: `card_3_${Date.now()}`,
            userId,
            subjectId,
            moduleId: mod2Id,
            topicId: top3Id,
            materialId: mat1Id,
            front: "Visibility of System Status",
            back: "Nielsen's 1st heuristic: Keep users informed about progress and states through appropriate and timely feedback.",
            type: "term_def",
            state: "new",
            intervalDays: 0,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: todayStr,
            createdAt: new Date().toISOString(),
          },
          {
            id: `card_4_${Date.now()}`,
            userId,
            subjectId,
            moduleId: mod1Id,
            topicId: top1Id,
            front: "Formative vs Summative Evaluation",
            back: "Formative evaluation is conducted during development to guide iteration; summative is done post-launch to assess overall success.",
            type: "term_def",
            state: "new",
            intervalDays: 0,
            easeFactor: 2.5,
            repetitions: 0,
            nextReviewDate: todayStr,
            createdAt: new Date().toISOString(),
          },
        ];

        const quizzes: Quiz[] = [
          {
            id: `quiz_itst306_mod2_${Date.now()}`,
            userId,
            subjectId,
            moduleId: mod2Id,
            title: "ITST 306 — Prototyping & Usability Check",
            isExamMode: false,
            timeLimitMinutes: 10,
            createdAt: new Date().toISOString(),
            questions: [
              {
                id: `q_1_${Date.now()}`,
                subjectId,
                moduleId: mod2Id,
                topicId: top3Id,
                materialId: mat1Id,
                type: "multiple_choice",
                question: "Which type of prototype is best suited for early-stage conceptual validation and rapid structural feedback?",
                options: [
                  "High-fidelity interactive mockup",
                  "Low-fidelity wireframe or paper prototype",
                  "Production staging build",
                  "Finished micro-interaction animation"
                ],
                correctAnswer: "Low-fidelity wireframe or paper prototype",
                explanation: "Low-fidelity prototypes prioritize layout structure, flow, and user goals over visual details, allowing rapid and cost-effective changes."
              },
              {
                id: `q_2_${Date.now()}`,
                subjectId,
                moduleId: mod2Id,
                topicId: top3Id,
                materialId: mat1Id,
                type: "multiple_choice",
                question: "What did Jakob Nielsen recommend regarding the sample size needed to identify the majority (~85%) of usability defects?",
                options: [
                  "50 participants across 5 demographics",
                  "5 to 8 participants in iterative rounds",
                  "At least 100 survey respondents",
                  "25 professional UX researchers"
                ],
                correctAnswer: "5 to 8 participants in iterative rounds",
                explanation: "Nielsen established that testing with 5 participants typically reveals ~85% of usability issues, offering the highest ROI per test."
              },
              {
                id: `q_3_${Date.now()}`,
                subjectId,
                moduleId: mod2Id,
                topicId: top3Id,
                materialId: mat1Id,
                type: "true_false",
                question: "A high-fidelity prototype should be created before conducting any initial user interviews or problem discovery.",
                options: ["True", "False"],
                correctAnswer: "False",
                explanation: "User discovery and problem definition always precede high-fidelity prototypes to avoid building the wrong solution."
              },
              {
                id: `q_4_${Date.now()}`,
                subjectId,
                moduleId: mod2Id,
                topicId: top3Id,
                materialId: mat1Id,
                type: "identification",
                question: "What term describes the visual property of an interface element that intuitively signals how it can be manipulated?",
                correctAnswer: "Affordance",
                explanation: "Affordance is the perceivable clue or characteristic that indicates how an object or UI control can be used."
              }
            ]
          }
        ];

        set((state) => ({
          subjects: [...state.subjects.filter((s) => s.code !== "ITST 306"), newSubject],
          modules: [...state.modules, ...modules],
          topics: [...state.topics, ...topics],
          materials: [...state.materials, ...materials],
          flashcards: [...state.flashcards, ...flashcards],
          quizzes: [...state.quizzes, ...quizzes],
        }));
      },

      resetAllStudyData: () => {
        set({
          subjects: [],
          modules: [],
          topics: [],
          materials: [],
          flashcards: [],
          quizzes: [],
          quizAttempts: [],
          mistakes: [],
        });
      },
    }),
    {
      name: "studydeck_study_state",
    }
  )
);
