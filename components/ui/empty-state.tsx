"use client";

import React from "react";
import clsx from "clsx";
import Character, { CharacterExpression } from "@/components/ui/character";
import { CompanionCharacterId } from "@/lib/types";

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  icon?: React.ReactNode;
}

interface EmptyStateProps {
  character?: CompanionCharacterId;
  expression?: CharacterExpression;
  speechBubble?: string;
  title: string;
  description?: string;
  actions?: ActionButton[];
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  character = "pip",
  expression = "neutral",
  speechBubble,
  title,
  description,
  actions,
  className,
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3.5 py-10 px-6 text-center select-none",
        className
      )}
    >
      {/* Mascot with optional speech bubble */}
      <Character
        character={character}
        expression={expression}
        size="lg"
        speechBubble={speechBubble}
        bubblePosition="top"
      />

      {/* Title */}
      <p
        className="text-lg font-bold tracking-tight mt-1"
        style={{ color: "var(--foreground)" }}
      >
        {title}
      </p>

      {/* Description */}
      {description && (
        <p
          className="text-sm max-w-sm leading-relaxed"
          style={{ color: "var(--muted-text)" }}
        >
          {description}
        </p>
      )}

      {/* Action buttons (Tactile 3D style) */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center mt-3">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={clsx(
                "inline-flex items-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-100",
                "border-b-4 active:border-b-0 active:translate-y-1 shadow-sm",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                action.variant === "secondary"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  : "bg-blue-600 text-white border-blue-800 hover:bg-blue-700"
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
