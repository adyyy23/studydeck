import React from "react";
import clsx from "clsx";

interface LogoProps {
  size?: number | "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  tagline?: boolean;
  className?: string;
  theme?: "light" | "dark" | "auto";
}

export const LogoMark: React.FC<{ size?: number; className?: string; theme?: "light" | "dark" | "auto" }> = ({
  size = 32,
  className = "",
  theme = "auto",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx("transition-transform duration-200", className)}
      aria-label="StudyDeck Logo Mark"
    >
      {/* 
        Original StudyDeck Geometric Mark:
        The Synthesis Deck — three interlocking geometric strata 
        signifying foundation, study cycles, and mastery apex.
      */}
      {/* Base Foundation Stratum */}
      <path
        d="M24 42L8 33.5L16 28.5L24 33L32 28.5L40 33.5L24 42Z"
        className={
          theme === "dark"
            ? "fill-blue-500"
            : theme === "light"
            ? "fill-brand-900"
            : "fill-brand-900 dark:fill-blue-500"
        }
      />
      {/* Mid Ascending Repetition Plane */}
      <path
        d="M24 30L10 22.5L18 17.5L24 21L30 17.5L38 22.5L24 30Z"
        className={
          theme === "dark"
            ? "fill-blue-400"
            : theme === "light"
            ? "fill-brand-700"
            : "fill-brand-700 dark:fill-blue-400"
        }
      />
      {/* Apex Focus & Knowledge Cap */}
      <path
        d="M24 18L12 11.5L24 5L36 11.5L24 18Z"
        className={
          theme === "dark"
            ? "fill-blue-300"
            : theme === "light"
            ? "fill-brand-600"
            : "fill-brand-600 dark:fill-blue-300"
        }
      />
      {/* Central Axis Alignment Needle / Connection Node */}
      <circle
        cx="24"
        cy="11.5"
        r="2.2"
        className={
          theme === "dark"
            ? "fill-slate-900"
            : theme === "light"
            ? "fill-white"
            : "fill-white dark:fill-slate-900"
        }
      />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showWordmark = true,
  tagline = false,
  className = "",
  theme = "auto",
}) => {
  const pixelSizes = {
    sm: 24,
    md: 32,
    lg: 44,
    xl: 60,
  };

  const actualSize = typeof size === "number" ? size : pixelSizes[size] || 32;

  return (
    <div className={clsx("inline-flex items-center gap-2.5 select-none", className)}>
      <LogoMark size={actualSize} theme={theme} />
      {showWordmark && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline tracking-tight">
            <span
              className={clsx(
                "font-bold font-sans",
                actualSize <= 28 ? "text-base" : actualSize <= 36 ? "text-lg" : "text-2xl",
                theme === "dark"
                  ? "text-slate-100"
                  : theme === "light"
                  ? "text-slate-900"
                  : "text-slate-900 dark:text-slate-100"
              )}
            >
              Study<span className="text-brand-600 dark:text-blue-400">Deck</span>
            </span>
          </div>
          {tagline && (
            <span
              className={clsx(
                "text-[11px] font-medium tracking-wide mt-0.5",
                theme === "dark"
                  ? "text-slate-400"
                  : theme === "light"
                  ? "text-slate-500"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              Study smarter. Together.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
