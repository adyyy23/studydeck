"use client";

import React from "react";
import clsx from "clsx";
import { AvatarId, AvatarAccessoryId, CompanionCharacterId } from "@/lib/types";
import { Character, CHARACTER_META } from "./character";

export type AvatarBadgeSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AnimalAvatarProps {
  avatarId?: AvatarId;
  accessory?: AvatarAccessoryId;
  size?: AvatarBadgeSize;
  showBorder?: boolean;
  borderColor?: string;
  isOnline?: boolean;
  points?: number;
  showPoints?: boolean;
  onClick?: () => void;
  className?: string;
}

const SIZE_CONTAINER: Record<AvatarBadgeSize, { sizeClass: string; charSize: "xs" | "sm" | "md" | "lg" | "xl" }> = {
  xs: { sizeClass: "w-7 h-7", charSize: "xs" },
  sm: { sizeClass: "w-9 h-9", charSize: "sm" },
  md: { sizeClass: "w-12 h-12", charSize: "md" },
  lg: { sizeClass: "w-16 h-16", charSize: "lg" },
  xl: { sizeClass: "w-24 h-24", charSize: "xl" },
};

const AVATAR_BG: Record<string, string> = {
  pip: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
  milo: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
  lumi: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800",
  barnaby: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  toby: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
  zara: "bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800",
  default: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700",
};

export const AnimalAvatar: React.FC<AnimalAvatarProps> = ({
  avatarId = "pip",
  accessory = "none",
  size = "md",
  showBorder = true,
  borderColor,
  isOnline,
  points,
  showPoints = false,
  onClick,
  className,
}) => {
  const { sizeClass, charSize } = SIZE_CONTAINER[size];

  // Check if avatar is one of the animal characters
  const isAnimal =
    avatarId === "pip" ||
    avatarId === "milo" ||
    avatarId === "lumi" ||
    avatarId === "barnaby" ||
    avatarId === "toby" ||
    avatarId === "zara";

  const resolvedCharacter: CompanionCharacterId = isAnimal
    ? (avatarId as CompanionCharacterId)
    : "pip";

  const bgStyle = AVATAR_BG[avatarId] || AVATAR_BG.default;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={clsx(
        "relative inline-flex items-center justify-center shrink-0 rounded-full select-none transition-transform duration-150",
        sizeClass,
        bgStyle,
        showBorder && "border-2 shadow-sm",
        onClick && "cursor-pointer hover:scale-105 active:scale-95",
        className
      )}
      style={borderColor ? { borderColor } : undefined}
      title={isAnimal ? CHARACTER_META[resolvedCharacter].name : "StudyDeck Avatar"}
    >
      {/* Inner Avatar Graphic */}
      {isAnimal ? (
        <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-full p-0.5">
          <Character
            character={resolvedCharacter}
            expression="neutral"
            size={charSize}
            accessory={accessory}
          />
        </div>
      ) : (
        /* Geometric fallback badge */
        <div className="w-full h-full flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200">
          SD
        </div>
      )}

      {/* Online Status Dot */}
      {isOnline !== undefined && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900",
            size === "xs" || size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5",
            isOnline ? "bg-emerald-500" : "bg-slate-400"
          )}
        />
      )}

      {/* Optional Study Points Badge */}
      {showPoints && points !== undefined && (
        <span className="absolute -bottom-1 -right-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-extrabold text-[9px] shadow-sm leading-tight border border-white dark:border-slate-900">
          ★ {points}
        </span>
      )}
    </div>
  );
};

export default AnimalAvatar;
