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
    <div className="fixed inset-0 z-50 flex justify-end bg-[#332821]/50 backdrop-blur-xs animate-fade-in select-none">
      <div
        className="w-full max-w-lg bg-[#F7F3EA] dark:bg-[#221B17] h-full border-l border-[#D6CCBF] dark:border-[#3D322B] shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Lumi */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#D6CCBF] dark:border-[#3D322B] bg-[#FFFCF6] dark:bg-[#2B231E] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#6B4E71]/15 border border-[#6B4E71]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#6B4E71]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-serif font-black text-[#332821] dark:text-[#F2EEE6]">Lumi AI Assistant</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#6B4E71]/15 text-[#6B4E71] dark:text-[#D8B4E2] border border-[#6B4E71]/20">
                  Course Tutor
                </span>
              </div>
              <p className="text-[11px] text-[#756C64] dark:text-[#9E9186] truncate max-w-xs">
                {contextTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#756C64] hover:text-[#332821] dark:text-[#9E9186] dark:hover:text-[#F2EEE6] rounded-lg hover:bg-[#EAE3D8] dark:hover:bg-[#2E2520] transition-colors touch-target"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
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
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0FDF4] dark:bg-[#052E16] text-[#3D6B4F] dark:text-[#86EFAC] border border-[#3D6B4F]/30">
                      <Check className="w-3 h-3" />
                      <span>Based on your course notes</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAE3D8] dark:bg-[#2E2520] text-[#756C64] dark:text-[#9E9186] border border-[#D6CCBF] dark:border-[#3D322B]">
                      <span>General academic knowledge</span>
                    </span>
                  )}
                </div>
              )}

              <div
                className={clsx(
                  "p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed shadow-xs",
                  m.sender === "user"
                    ? "bg-[#49372D] text-[#F7F3EA] rounded-br-xs"
                    : "bg-[#FFFCF6] dark:bg-[#2B231E] border border-[#D6CCBF] dark:border-[#3D322B] text-[#332821] dark:text-[#F2EEE6] rounded-bl-xs"
                )}
              >
                {m.content}
              </div>

              {/* Citation quote footer */}
              {m.citation && (
                <div className="mt-1 text-[11px] text-[#756C64] dark:text-[#9E9186] italic pl-2 border-l-2 border-[#B77A45]">
                  &ldquo;{m.citation}&rdquo;
                </div>
              )}

              <span className="text-[9px] text-[#756C64] dark:text-[#9E9186] mt-0.5 px-1">{m.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FFFCF6] dark:bg-[#2B231E] text-[#756C64] dark:text-[#9E9186] text-xs border border-[#D6CCBF] dark:border-[#3D322B] animate-pulse w-fit">
              <Sparkles className="w-3.5 h-3.5 text-[#D79A45]" />
              <span>Lumi is consulting your course materials...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 sm:px-4 py-2 border-t border-[#D6CCBF] dark:border-[#3D322B] flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-[#FFFCF6] dark:bg-[#2B231E] shrink-0">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#D6CCBF] dark:border-[#3D322B] bg-[#F7F3EA] dark:bg-[#221B17] hover:bg-[#EAE3D8] dark:hover:bg-[#2E2520] text-[#332821] dark:text-[#F2EEE6] whitespace-nowrap transition-colors touch-target"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input Bar with Safe Area Bottom */}
        <div className="p-3 border-t border-[#D6CCBF] dark:border-[#3D322B] flex items-center gap-2 bg-[#FFFCF6] dark:bg-[#2B231E] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shrink-0">
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
            placeholder="Ask Lumi anything about this course..."
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-[#D6CCBF] dark:border-[#3D322B] bg-[#F7F3EA] dark:bg-[#221B17] text-xs sm:text-sm text-[#332821] dark:text-[#F2EEE6] focus:outline-none focus:border-[#B77A45]"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || loading}
            className="btn-primary p-2.5 rounded-lg text-white disabled:opacity-40 transition-colors shadow-xs touch-target"
            aria-label="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContextualAIDrawer;
