"use client";

import React, { useState } from "react";
import { X, Send, BookOpen, Sparkles, FileText, Check } from "lucide-react";
import clsx from "clsx";
import { queryStudyAssistant } from "@/lib/ai-engine";
import { AIChatMessage } from "@/lib/types";
import { Character } from "@/components/ui/character";

interface ContextualAIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contextTitle: string; // e.g. "ITST 306 · Module 2: Prototyping"
  materialTitle?: string;
  materialContent?: string;
  subjectName?: string;
  initialQuery?: string;
}

export function ContextualAIDrawer({
  isOpen,
  onClose,
  contextTitle,
  materialTitle,
  materialContent,
  subjectName,
  initialQuery,
}: ContextualAIDrawerProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "init_1",
      sender: "assistant",
      content: `I'm Lumi, your Study Assistant for **${contextTitle}**.\n\nAsk me any question about your notes or concepts. I'll listen carefully and cite your course materials directly!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMsg: AIChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    setTimeout(() => {
      const response = queryStudyAssistant(query, {
        materialTitle,
        materialContent,
        subjectName,
      });

      const assistantMsg: AIChatMessage = {
        id: `msg_a_${Date.now()}`,
        sender: "assistant",
        content: response.content,
        groundedInMaterial: response.groundedInMaterial,
        citation: response.citation,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, 400);
  };

  const quickActions = [
    "Explain this in simpler words",
    "Give me an example",
    "Why was my answer wrong?",
    "Summarize key definitions",
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in select-none">
      <div
        className="w-full max-w-lg bg-surface h-full border-l border-border shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Lumi */}
        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-amber-500/10 via-surface to-indigo-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Character character="lumi" expression={loading ? "thinking" : "happy"} size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-foreground">Lumi Study Assistant</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                  AI Tutor
                </span>
              </div>
              <p className="text-xs text-muted-text mt-0.5 truncate max-w-xs">
                {contextTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted-text hover:text-foreground rounded-xl hover:bg-surface-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={clsx(
                "flex flex-col max-w-[88%]",
                m.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              {/* Grounded Citation Badge */}
              {m.sender === "assistant" && m.groundedInMaterial !== undefined && (
                <div className="mb-1">
                  {m.groundedInMaterial ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                      <Check className="w-3 h-3" />
                      <span>Based on your course notes</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      <span>General academic knowledge</span>
                    </span>
                  )}
                </div>
              )}

              <div
                className={clsx(
                  "p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs",
                  m.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-xs"
                    : "bg-surface-muted border border-border text-foreground rounded-bl-xs"
                )}
              >
                {m.content}
              </div>

              {/* Citation quote footer */}
              {m.citation && (
                <div className="mt-1 text-[11px] text-muted-text italic pl-2 border-l-2 border-accent">
                  &ldquo;{m.citation}&rdquo;
                </div>
              )}

              <span className="text-[10px] text-muted-text mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-surface-muted text-muted-text text-xs border border-border animate-pulse w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Lumi is listening and searching your materials...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-surface-muted/30">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-border bg-surface hover:bg-surface-muted text-foreground whitespace-nowrap transition"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border flex items-center gap-2 bg-surface">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Lumi anything about this subject..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface-muted text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || loading}
            className="btn-tactile p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-blue-800 disabled:opacity-40 transition shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContextualAIDrawer;
