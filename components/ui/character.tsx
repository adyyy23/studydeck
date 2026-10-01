"use client";

import React from "react";
import clsx from "clsx";
import { CompanionCharacterId, AvatarAccessoryId } from "@/lib/types";

export type CharacterExpression =
  | "neutral"
  | "studying"
  | "happy"
  | "celebrating"
  | "focused"
  | "confused"
  | "encouraging"
  | "sleepy"
  | "thinking"
  | "hello"
  | "surprised";

export type CharacterSize = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

export interface CharacterProps {
  character?: CompanionCharacterId;
  expression?: CharacterExpression;
  size?: CharacterSize;
  accessory?: AvatarAccessoryId;
  speechBubble?: string;
  bubblePosition?: "top" | "right" | "left";
  className?: string;
}

const SIZE_MAP: Record<CharacterSize, number> = {
  xs: 36,
  sm: 48,
  md: 84,
  lg: 128,
  xl: 172,
  hero: 220,
};

export const CHARACTER_META: Record<
  CompanionCharacterId,
  { name: string; title: string; trait: string; badgeColor: string }
> = {
  pip: {
    name: "Pip",
    title: "The Red Panda",
    trait: "Curious, encouraging study companion",
    badgeColor: "#E05A47",
  },
  milo: {
    name: "Milo",
    title: "The Capybara",
    trait: "Zen master of deep focus & Pomodoro",
    badgeColor: "#8A6B4F",
  },
  lumi: {
    name: "Lumi",
    title: "The Fennec Fox",
    trait: "AI assistant with big listening ears",
    badgeColor: "#D97706",
  },
  barnaby: {
    name: "Barnaby",
    title: "The Sea Otter",
    trait: "Social collaborator for group study & rooms",
    badgeColor: "#4B7A5A",
  },
  toby: {
    name: "Toby",
    title: "The Pangolin",
    trait: "Meticulous organizer for timetables & schedules",
    badgeColor: "#2563EB",
  },
  zara: {
    name: "Zara",
    title: "The Quokka",
    trait: "High-energy speed challenger & game champion",
    badgeColor: "#EC4899",
  },
};

export const ACCESSORY_META: Record<
  AvatarAccessoryId,
  { name: string; unlockRequirement: string; icon: string }
> = {
  none: { name: "No Accessory", unlockRequirement: "Default", icon: "✨" },
  headphones: { name: "Focus Beats", unlockRequirement: "Complete 5 Pomodoro sessions", icon: "🎧" },
  glasses: { name: "Scholar Specs", unlockRequirement: "Review 100 flashcards", icon: "👓" },
  beanie: { name: "Campus Beanie", unlockRequirement: "Maintain a 7-day streak", icon: "🧢" },
  headband: { name: "Mastery Headband", unlockRequirement: "Resolve 20 notebook mistakes", icon: "🥋" },
  cap: { name: "Study Club Cap", unlockRequirement: "Join or host a study room", icon: "🎓" },
  badge_feather: { name: "Honors Quill", unlockRequirement: "Complete an exam readiness check", icon: "🪶" },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Accessories SVG layer (rendered atop head/ears)
───────────────────────────────────────────────────────────────────────────── */
const RenderAccessory: React.FC<{ accessory: AvatarAccessoryId }> = ({ accessory }) => {
  if (accessory === "none") return null;

  switch (accessory) {
    case "headphones":
      return (
        <g id="accessory-headphones">
          {/* Headband arch */}
          <path
            d="M26 40 C26 18, 74 18, 74 40"
            fill="none"
            stroke="#1E293B"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M28 38 C28 21, 72 21, 72 38"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Left Earcup */}
          <rect x="20" y="34" width="9" height="18" rx="4.5" fill="#1E293B" />
          <rect x="22" y="36" width="5" height="14" rx="2.5" fill="#60A5FA" />
          {/* Right Earcup */}
          <rect x="71" y="34" width="9" height="18" rx="4.5" fill="#1E293B" />
          <rect x="73" y="36" width="5" height="14" rx="2.5" fill="#60A5FA" />
        </g>
      );

    case "glasses":
      return (
        <g id="accessory-glasses">
          {/* Left frame */}
          <circle cx="39" cy="48" r="9" fill="none" stroke="#0F172A" strokeWidth="2.4" />
          <circle cx="39" cy="48" r="8" fill="#93C5FD" fillOpacity="0.25" />
          {/* Right frame */}
          <circle cx="61" cy="48" r="9" fill="none" stroke="#0F172A" strokeWidth="2.4" />
          <circle cx="61" cy="48" r="8" fill="#93C5FD" fillOpacity="0.25" />
          {/* Bridge */}
          <path d="M48 47 Q50 45 52 47" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          {/* Side bars */}
          <line x1="30" y1="47" x2="25" y2="45" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          <line x1="70" y1="47" x2="75" y2="45" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          {/* Lens sheen */}
          <line x1="36" y1="43" x2="41" y2="48" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          <line x1="58" y1="43" x2="63" y2="48" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
        </g>
      );

    case "beanie":
      return (
        <g id="accessory-beanie">
          {/* Pom-pom */}
          <circle cx="50" cy="18" r="6" fill="#F43F5E" />
          <circle cx="48" cy="16" r="2" fill="#FDA4AF" />
          {/* Beanie dome */}
          <path
            d="M28 36 C28 20, 72 20, 72 36 Z"
            fill="#E11D48"
          />
          {/* Beanie stripes */}
          <path d="M35 34 C35 24, 65 24, 65 34" fill="none" stroke="#FFE4E6" strokeWidth="2" strokeDasharray="3 3" />
          {/* Folded rim */}
          <rect x="25" y="33" width="50" height="8" rx="3.5" fill="#BE123C" />
          <line x1="28" y1="37" x2="72" y2="37" stroke="#FDA4AF" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
        </g>
      );

    case "headband":
      return (
        <g id="accessory-headband">
          {/* Band */}
          <path
            d="M26 38 C34 35, 66 35, 74 38 L73 44 C65 41, 35 41, 27 44 Z"
            fill="#D97706"
          />
          {/* Center emblem */}
          <circle cx="50" cy="40" r="3" fill="#FEF3C7" />
          <circle cx="50" cy="40" r="1.5" fill="#B45309" />
          {/* Knot tail fluttering */}
          <path d="M73 40 Q79 38 82 44 Q77 44 74 43 Z" fill="#B45309" />
        </g>
      );

    case "cap":
      return (
        <g id="accessory-cap">
          {/* Cap dome */}
          <path
            d="M28 37 C28 23, 72 23, 72 37 Z"
            fill="#2563EB"
          />
          {/* Visor / brim pointing right */}
          <path
            d="M26 36 C40 34, 64 34, 73 36 L83 40 C75 42, 60 41, 26 39 Z"
            fill="#1D4ED8"
          />
          {/* Top rivet */}
          <circle cx="50" cy="24" r="2.5" fill="#1E40AF" />
          {/* White embroidered S logo on cap */}
          <path
            d="M48 29 C49 28, 51 28, 52 29 C52 30, 48 31, 48 32 C48 33, 52 34, 51 35 C50 35, 48 35, 47 34"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      );

    case "badge_feather":
      return (
        <g id="accessory-feather">
          {/* Quill feather behind right ear */}
          <path
            d="M68 36 C74 24, 82 16, 86 12 C85 20, 80 28, 72 36 Z"
            fill="#10B981"
          />
          <path
            d="M68 36 C76 26, 84 18, 86 12"
            fill="none"
            stroke="#047857"
            strokeWidth="1.2"
          />
          <circle cx="70" cy="36" r="3" fill="#F59E0B" />
        </g>
      );

    default:
      return null;
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   Pip the Red Panda (Primary mascot)
───────────────────────────────────────────────────────────────────────────── */
const PipMascot: React.FC<{ expression: CharacterExpression }> = ({ expression }) => {
  const isStudying = expression === "studying";
  const isCelebrating = expression === "celebrating";
  const isHello = expression === "hello";
  const isSleepy = expression === "sleepy";
  const isThinking = expression === "thinking";
  const isSurprised = expression === "surprised";

  return (
    <g id="mascot-pip">
      {/* Fluffy Red Panda Tail (peeking from behind left/bottom) */}
      <path
        d="M24 72 C12 70, 4 80, 8 89 C12 96, 24 94, 32 86 C28 80, 26 75, 24 72 Z"
        fill="#E05A47"
      />
      {/* Tail cream stripes */}
      <path d="M12 76 C10 82, 14 86, 17 84" stroke="#FFF1E6" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 84 C17 90, 22 93, 26 90" stroke="#FFF1E6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="8" cy="89" r="3.5" fill="#3D201A" />

      {/* Body / Torso */}
      <ellipse cx="50" cy="74" rx="26" ry="19" fill="#E05A47" />
      {/* Chest Bib - warm dark espresso */}
      <ellipse cx="50" cy="76" rx="17" ry="13" fill="#2E1B17" />
      {/* Front belly cream highlight */}
      <ellipse cx="50" cy="78" rx="9" ry="8" fill="#FFF7ED" opacity="0.9" />

      {/* Ears */}
      {/* Left Ear */}
      <path d="M22 34 Q20 12 37 20 Z" fill="#2E1B17" />
      <path d="M24 31 Q23 18 34 22 Z" fill="#FFF7ED" />
      {/* Right Ear */}
      <path d="M78 34 Q80 12 63 20 Z" fill="#2E1B17" />
      <path d="M76 31 Q77 18 66 22 Z" fill="#FFF7ED" />

      {/* Head - russet terracotta */}
      <ellipse cx="50" cy="46" rx="27" ry="22" fill="#E05A47" />

      {/* Cream Cheek Patches & Muzzle */}
      {/* Left cheek teardrop */}
      <path d="M25 48 C24 57, 33 60, 39 53 C36 46, 28 44, 25 48 Z" fill="#FFF7ED" />
      {/* Right cheek teardrop */}
      <path d="M75 48 C76 57, 67 60, 61 53 C64 46, 72 44, 75 48 Z" fill="#FFF7ED" />
      {/* Muzzle center oval */}
      <ellipse cx="50" cy="53" rx="11" ry="8" fill="#FFF7ED" />

      {/* Distinct Red Panda Eyebrow Spots (Cream dots above eyes) */}
      <circle cx="41" cy="35" r="2.8" fill="#FFF7ED" />
      <circle cx="59" cy="35" r="2.8" fill="#FFF7ED" />

      {/* Tear-streak markings (red panda eye-to-corner brown stripes) */}
      <path d="M37 47 Q35 52 34 56" stroke="#C2410C" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M63 47 Q65 52 66 56" stroke="#C2410C" strokeWidth="2.2" strokeLinecap="round" />

      {/* Eyes */}
      {isSleepy ? (
        <g>
          <path d="M38 45 Q42 49 46 45" stroke="#1F2937" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M54 45 Q58 49 62 45" stroke="#1F2937" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <text x="68" y="34" fontSize="9" fill="#E05A47" fontWeight="bold">z</text>
          <text x="73" y="27" fontSize="7" fill="#E05A47" fontWeight="bold">z</text>
        </g>
      ) : isCelebrating ? (
        <g>
          {/* Happy squint arcs */}
          <path d="M37 45 Q41 40 45 45" stroke="#1F2937" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path d="M55 45 Q59 40 63 45" stroke="#1F2937" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          {/* Star sparkles */}
          <text x="20" y="32" fontSize="10" fill="#F59E0B">✨</text>
          <text x="74" y="32" fontSize="10" fill="#F59E0B">✨</text>
        </g>
      ) : isStudying ? (
        <g>
          {/* Eyes focused downwards */}
          <ellipse cx="42" cy="46" rx="3.5" ry="3.8" fill="#1F2937" />
          <circle cx="43" cy="47" r="1.4" fill="#FFFFFF" />
          <ellipse cx="58" cy="46" rx="3.5" ry="3.8" fill="#1F2937" />
          <circle cx="59" cy="47" r="1.4" fill="#FFFFFF" />
        </g>
      ) : isThinking ? (
        <g>
          {/* Eyes looking up right */}
          <ellipse cx="42" cy="43" rx="3.5" ry="3.5" fill="#1F2937" />
          <circle cx="43.5" cy="42" r="1.3" fill="#FFFFFF" />
          <ellipse cx="58" cy="43" rx="3.5" ry="3.5" fill="#1F2937" />
          <circle cx="59.5" cy="42" r="1.3" fill="#FFFFFF" />
        </g>
      ) : isSurprised ? (
        <g>
          {/* Wide round eyes */}
          <circle cx="41" cy="44" r="4.5" fill="#1F2937" />
          <circle cx="42.5" cy="42.5" r="1.8" fill="#FFFFFF" />
          <circle cx="59" cy="44" r="4.5" fill="#1F2937" />
          <circle cx="60.5" cy="42.5" r="1.8" fill="#FFFFFF" />
        </g>
      ) : (
        /* Neutral / Happy / Hello eyes */
        <g>
          <circle cx="41" cy="44" r="3.6" fill="#1F2937" />
          <circle cx="42.2" cy="42.8" r="1.4" fill="#FFFFFF" />
          <circle cx="59" cy="44" r="3.6" fill="#1F2937" />
          <circle cx="60.2" cy="42.8" r="1.4" fill="#FFFFFF" />
        </g>
      )}

      {/* Nose */}
      <ellipse cx="50" cy="50" rx="3.2" ry="2.4" fill="#2E1B17" />

      {/* Mouth */}
      {isSurprised ? (
        <circle cx="50" cy="56" r="2.5" fill="#2E1B17" />
      ) : isCelebrating || expression === "happy" || isHello ? (
        <path d="M46 53 Q50 58 54 53" stroke="#2E1B17" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      ) : isStudying ? (
        <path d="M48 53 Q50 54 52 53" stroke="#2E1B17" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M47 53 Q50 55 53 53" stroke="#2E1B17" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      )}

      {/* Paws / Hands */}
      {isCelebrating ? (
        <g>
          {/* Both paws raised high */}
          <ellipse cx="26" cy="46" rx="5" ry="6" fill="#2E1B17" transform="rotate(-30 26 46)" />
          <ellipse cx="74" cy="46" rx="5" ry="6" fill="#2E1B17" transform="rotate(30 74 46)" />
        </g>
      ) : isHello ? (
        <g>
          {/* Left paw resting, right paw waving up high */}
          <ellipse cx="32" cy="74" rx="5.5" ry="5.5" fill="#2E1B17" />
          <ellipse cx="75" cy="46" rx="6" ry="7" fill="#2E1B17" transform="rotate(25 75 46)" />
          <path d="M72 40 Q76 38 80 41" stroke="#FFF7ED" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      ) : isStudying ? (
        <g>
          {/* Holding an open study flashcard / notebook */}
          <rect x="38" y="68" width="24" height="16" rx="2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
          <line x1="42" y1="72" x2="58" y2="72" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="42" y1="76" x2="54" y2="76" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="42" y1="80" x2="50" y2="80" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
          {/* Paws holding edges of book */}
          <circle cx="37" cy="76" r="4.5" fill="#2E1B17" />
          <circle cx="63" cy="76" r="4.5" fill="#2E1B17" />
        </g>
      ) : isThinking ? (
        <g>
          <ellipse cx="34" cy="74" rx="5" ry="5" fill="#2E1B17" />
          {/* Right paw under chin */}
          <ellipse cx="56" cy="57" rx="5" ry="5" fill="#2E1B17" />
        </g>
      ) : (
        /* Relaxed paws resting in front */
        <g>
          <ellipse cx="36" cy="74" rx="5.5" ry="5.5" fill="#2E1B17" />
          <ellipse cx="64" cy="74" rx="5.5" ry="5.5" fill="#2E1B17" />
        </g>
      )}
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Milo the Capybara (Pomodoro & Deep Focus Master)
───────────────────────────────────────────────────────────────────────────── */
const MiloMascot: React.FC<{ expression: CharacterExpression }> = ({ expression }) => {
  const isStudying = expression === "studying" || expression === "focused";
  const isCelebrating = expression === "celebrating";

  return (
    <g id="mascot-milo">
      {/* Cozy rounded Capybara body */}
      <ellipse cx="50" cy="75" rx="30" ry="20" fill="#8A6B4F" />
      <ellipse cx="50" cy="78" rx="20" ry="14" fill="#A48263" />

      {/* Tiny rounded ears */}
      <ellipse cx="27" cy="36" rx="4.5" ry="5" fill="#6A4E36" transform="rotate(-15 27 36)" />
      <ellipse cx="73" cy="36" rx="4.5" ry="5" fill="#6A4E36" transform="rotate(15 73 36)" />

      {/* Signature square/blocky gentle Capybara head */}
      <rect x="29" y="30" width="42" height="36" rx="14" fill="#8A6B4F" />
      {/* Muzzle / nose block */}
      <rect x="34" y="44" width="32" height="22" rx="10" fill="#75563D" />

      {/* Sprout Leaf atop head (Zen icon) */}
      <path d="M50 30 C50 20, 42 18, 40 22 C42 26, 48 27, 50 30 Z" fill="#22C55E" />
      <path d="M50 30 C50 22, 58 20, 60 24 C58 27, 52 28, 50 30 Z" fill="#16A34A" />
      <line x1="50" y1="30" x2="50" y2="23" stroke="#15803D" strokeWidth="1.2" />

      {/* Eyes: iconic serene half-closed slits */}
      {isCelebrating ? (
        <g>
          <path d="M36 42 Q41 38 46 42" stroke="#2D1E12" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M54 42 Q59 38 64 42" stroke="#2D1E12" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      ) : (
        <g>
          <line x1="36" y1="42" x2="45" y2="42" stroke="#2D1E12" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="55" y1="42" x2="64" y2="42" stroke="#2D1E12" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )}

      {/* Wide nostrils */}
      <ellipse cx="45" cy="54" rx="2" ry="1.6" fill="#3D2919" />
      <ellipse cx="55" cy="54" rx="2" ry="1.6" fill="#3D2919" />

      {/* Peaceful smile */}
      <path d="M47 60 Q50 62 53 60" stroke="#3D2919" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Tea Cup or Paws */}
      {isStudying ? (
        <g>
          {/* Ceramic warm mug with steam */}
          <rect x="42" y="70" width="16" height="14" rx="3" fill="#E2E8F0" />
          <path d="M58 73 Q62 76 58 80" stroke="#CBD5E1" strokeWidth="1.8" fill="none" />
          <line x1="45" y1="73" x2="55" y2="73" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
          {/* Steam curls */}
          <path d="M47 67 Q49 64 47 61" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M53 66 Q55 63 53 60" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
          {/* Paws hugging mug */}
          <circle cx="39" cy="76" r="4.5" fill="#6A4E36" />
          <circle cx="61" cy="76" r="4.5" fill="#6A4E36" />
        </g>
      ) : (
        <g>
          <ellipse cx="36" cy="76" rx="5" ry="5" fill="#6A4E36" />
          <ellipse cx="64" cy="76" rx="5" ry="5" fill="#6A4E36" />
        </g>
      )}
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Lumi the Fennec Fox (Curious AI Study Assistant)
───────────────────────────────────────────────────────────────────────────── */
const LumiMascot: React.FC<{ expression: CharacterExpression }> = ({ expression }) => {
  const isThinking = expression === "thinking" || expression === "studying";
  const isHappy = expression === "happy" || expression === "celebrating" || expression === "hello";

  return (
    <g id="mascot-lumi">
      {/* Huge iconic Fennec Fox Ears (Giant listening ears) */}
      {/* Left Ear */}
      <path d="M30 40 C14 20, 10 5, 26 8 C38 12, 38 28, 36 40 Z" fill="#F5E6CA" />
      <path d="M28 36 C18 22, 16 12, 26 13 C32 15, 34 26, 32 36 Z" fill="#FBCFE8" opacity="0.8" />
      {/* Right Ear */}
      <path d="M70 40 C86 20, 90 5, 74 8 C62 12, 62 28, 64 40 Z" fill="#F5E6CA" />
      <path d="M72 36 C82 22, 84 12, 74 13 C68 15, 66 26, 68 36 Z" fill="#FBCFE8" opacity="0.8" />

      {/* Body */}
      <ellipse cx="50" cy="75" rx="22" ry="18" fill="#F5E6CA" />
      <ellipse cx="50" cy="77" rx="14" ry="13" fill="#FFFFFF" />

      {/* Head - delicate heart-shaped */}
      <path
        d="M28 46 C28 32, 72 32, 72 46 C72 58, 56 64, 50 65 C44 64, 28 58, 28 46 Z"
        fill="#F5E6CA"
      />
      {/* Cheek white tufts */}
      <path d="M27 48 C24 54, 30 58, 36 54 Z" fill="#FFFFFF" />
      <path d="M73 48 C76 54, 70 58, 64 54 Z" fill="#FFFFFF" />

      {/* Inquisitive large amber eyes */}
      {isHappy ? (
        <g>
          <path d="M38 46 Q43 41 47 46" stroke="#292524" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M53 46 Q57 41 62 46" stroke="#292524" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      ) : isThinking ? (
        <g>
          <ellipse cx="43" cy="44" rx="4" ry="4.5" fill="#D97706" />
          <circle cx="43" cy="44" r="2.5" fill="#1C1917" />
          <circle cx="44.5" cy="42.5" r="1.3" fill="#FFFFFF" />

          <ellipse cx="57" cy="44" rx="4" ry="4.5" fill="#D97706" />
          <circle cx="57" cy="44" r="2.5" fill="#1C1917" />
          <circle cx="58.5" cy="42.5" r="1.3" fill="#FFFFFF" />

          {/* AI prompt sparkle dot */}
          <circle cx="68" cy="36" r="2.5" fill="#60A5FA" />
          <circle cx="73" cy="30" r="1.5" fill="#93C5FD" />
        </g>
      ) : (
        <g>
          <ellipse cx="42" cy="46" rx="4.2" ry="4.5" fill="#D97706" />
          <circle cx="42" cy="46" r="2.8" fill="#1C1917" />
          <circle cx="43.5" cy="44.5" r="1.5" fill="#FFFFFF" />

          <ellipse cx="58" cy="46" rx="4.2" ry="4.5" fill="#D97706" />
          <circle cx="58" cy="46" r="2.8" fill="#1C1917" />
          <circle cx="59.5" cy="44.5" r="1.5" fill="#FFFFFF" />
        </g>
      )}

      {/* Pointy dark nose */}
      <polygon points="50,56 47,53 53,53" fill="#292524" />
      <path d="M48 57 Q50 59 52 57" stroke="#292524" strokeWidth="1.4" strokeLinecap="round" fill="none" />

      {/* Paws */}
      <circle cx="40" cy="74" r="4.5" fill="#EBD2A9" />
      <circle cx="60" cy="74" r="4.5" fill="#EBD2A9" />
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Barnaby the Sea Otter (Social & Group Study)
───────────────────────────────────────────────────────────────────────────── */
const BarnabyMascot: React.FC<{ expression: CharacterExpression }> = ({ expression }) => {
  const isCelebrating = expression === "celebrating";

  return (
    <g id="mascot-barnaby">
      {/* Otter body */}
      <ellipse cx="50" cy="74" rx="26" ry="20" fill="#6B4F3A" />
      {/* Cream bib */}
      <ellipse cx="50" cy="76" rx="16" ry="14" fill="#F5EBE1" />

      {/* Small round ears */}
      <circle cx="28" cy="38" r="4.5" fill="#523B2A" />
      <circle cx="28" cy="38" r="2.5" fill="#F5EBE1" />
      <circle cx="72" cy="38" r="4.5" fill="#523B2A" />
      <circle cx="72" cy="38" r="2.5" fill="#F5EBE1" />

      {/* Broad friendly head */}
      <ellipse cx="50" cy="47" rx="25" ry="20" fill="#6B4F3A" />

      {/* Cream whiskered muzzle */}
      <ellipse cx="50" cy="52" rx="14" ry="10" fill="#F5EBE1" />

      {/* Eyes */}
      {isCelebrating ? (
        <g>
          <path d="M38 45 Q42 40 46 45" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M54 45 Q58 40 62 45" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      ) : (
        <g>
          <circle cx="41" cy="45" r="3.4" fill="#1F2937" />
          <circle cx="42.2" cy="43.8" r="1.2" fill="#FFFFFF" />
          <circle cx="59" cy="45" r="3.4" fill="#1F2937" />
          <circle cx="60.2" cy="43.8" r="1.2" fill="#FFFFFF" />
        </g>
      )}

      {/* Wide black button nose */}
      <ellipse cx="50" cy="49" rx="3.5" ry="2.6" fill="#1F2937" />

      {/* Whiskers */}
      <line x1="32" y1="52" x2="24" y2="51" stroke="#A8927F" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="32" y1="55" x2="24" y2="56" stroke="#A8927F" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="68" y1="52" x2="76" y2="51" stroke="#A8927F" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="68" y1="55" x2="76" y2="56" stroke="#A8927F" strokeWidth="1.2" strokeLinecap="round" />

      {/* Mouth */}
      <path d="M47 54 Q50 56 53 54" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Paws held together clutching a pencil */}
      <g>
        {/* Study pencil held between paws */}
        <rect x="42" y="70" width="16" height="5" rx="1.5" fill="#F59E0B" transform="rotate(-15 50 72)" />
        <polygon points="58,68 62,69 59,72" fill="#3B82F6" />
        <circle cx="42" cy="74" r="5" fill="#523B2A" />
        <circle cx="58" cy="74" r="5" fill="#523B2A" />
      </g>
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Toby the Pangolin (Schedule & Timetable Organizer)
───────────────────────────────────────────────────────────────────────────── */
const TobyMascot: React.FC<{ expression: CharacterExpression }> = ({ expression }) => {
  return (
    <g id="mascot-toby">
      {/* Pangolin body with overlapping geometric plate scales (looks like neat planner binder tabs) */}
      <ellipse cx="50" cy="74" rx="26" ry="19" fill="#475569" />

      {/* Protective geometric scales */}
      <path d="M30 68 C35 60, 45 60, 50 68 Z" fill="#64748B" stroke="#334155" strokeWidth="1" />
      <path d="M50 68 C55 60, 65 60, 70 68 Z" fill="#64748B" stroke="#334155" strokeWidth="1" />
      <path d="M40 76 C45 68, 55 68, 60 76 Z" fill="#94A3B8" stroke="#475569" strokeWidth="1" />
      <path d="M26 78 C31 70, 41 70, 46 78 Z" fill="#64748B" stroke="#334155" strokeWidth="1" />
      <path d="M54 78 C59 70, 69 70, 74 78 Z" fill="#64748B" stroke="#334155" strokeWidth="1" />

      {/* Snout & head */}
      <path d="M34 44 C34 34, 66 34, 66 44 C66 54, 56 60, 50 62 C44 60, 34 54, 34 44 Z" fill="#64748B" />
      {/* Head scale helmet */}
      <path d="M38 38 C44 32, 56 32, 62 38 Z" fill="#94A3B8" />

      {/* Friendly gentle eyes */}
      <circle cx="43" cy="46" r="3" fill="#0F172A" />
      <circle cx="44" cy="45" r="1.1" fill="#FFFFFF" />
      <circle cx="57" cy="46" r="3" fill="#0F172A" />
      <circle cx="58" cy="45" r="1.1" fill="#FFFFFF" />

      {/* Neat snout & smile */}
      <ellipse cx="50" cy="55" rx="2" ry="1.5" fill="#1E293B" />
      <path d="M48 57 Q50 59 52 57" stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" fill="none" />

      {/* Holding a miniature calendar / timetable tablet */}
      <rect x="38" y="70" width="24" height="18" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
      <rect x="38" y="70" width="24" height="5" rx="1" fill="#2563EB" />
      {/* Calendar grid dots */}
      <circle cx="43" cy="78" r="1" fill="#64748B" />
      <circle cx="47" cy="78" r="1" fill="#64748B" />
      <circle cx="51" cy="78" r="1" fill="#64748B" />
      <circle cx="55" cy="78" r="1" fill="#64748B" />
      <circle cx="43" cy="82" r="1" fill="#64748B" />
      <circle cx="47" cy="82" r="1" fill="#2563EB" />
      <circle cx="51" cy="82" r="1" fill="#64748B" />
      <circle cx="55" cy="82" r="1" fill="#64748B" />

      {/* Neat claws holding tablet */}
      <circle cx="36" cy="78" r="4" fill="#334155" />
      <circle cx="64" cy="78" r="4" fill="#334155" />
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Zara the Quokka (High-Energy Game Champion)
───────────────────────────────────────────────────────────────────────────── */
const ZaraMascot: React.FC<{ expression: CharacterExpression }> = ({ expression }) => {
  return (
    <g id="mascot-zara">
      {/* Energetic rounded body */}
      <ellipse cx="50" cy="74" rx="27" ry="20" fill="#A88258" />
      <ellipse cx="50" cy="76" rx="17" ry="14" fill="#D6B894" />

      {/* Round ears */}
      <circle cx="27" cy="35" r="5.5" fill="#8C6842" />
      <circle cx="27" cy="35" r="3" fill="#F87171" opacity="0.6" />
      <circle cx="73" cy="35" r="5.5" fill="#8C6842" />
      <circle cx="73" cy="35" r="3" fill="#F87171" opacity="0.6" />

      {/* Famous Quokka Smile Head */}
      <ellipse cx="50" cy="47" rx="26" ry="21" fill="#A88258" />

      {/* Cheerful rosy cheek blushes */}
      <circle cx="34" cy="50" r="4" fill="#FCA5A5" opacity="0.8" />
      <circle cx="66" cy="50" r="4" fill="#FCA5A5" opacity="0.8" />

      {/* Sparkling energetic eyes */}
      <circle cx="40" cy="43" r="4" fill="#1C1917" />
      <circle cx="41.5" cy="41.5" r="1.6" fill="#FFFFFF" />
      <circle cx="42.5" cy="43.5" r="0.8" fill="#FFFFFF" />

      <circle cx="60" cy="43" r="4" fill="#1C1917" />
      <circle cx="61.5" cy="41.5" r="1.6" fill="#FFFFFF" />
      <circle cx="62.5" cy="43.5" r="0.8" fill="#FFFFFF" />

      {/* Black button nose */}
      <ellipse cx="50" cy="47" rx="3.5" ry="2.6" fill="#1C1917" />

      {/* Irresistible Wide Quokka Grin */}
      <path
        d="M42 50 C44 58, 56 58, 58 50 Z"
        fill="#991B1B"
      />
      <path
        d="M45 54 C47 57, 53 57, 55 54 Z"
        fill="#F87171"
      />
      <path
        d="M40 50 Q50 60 60 50"
        stroke="#1C1917"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Champion fist pump! */}
      <ellipse cx="28" cy="64" rx="5.5" ry="6" fill="#8C6842" transform="rotate(-30 28 64)" />
      {/* Right paw raised in victory fist */}
      <ellipse cx="74" cy="46" rx="6" ry="6" fill="#8C6842" />
      <text x="76" y="38" fontSize="12">⚡</text>
    </g>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Main Character Component
───────────────────────────────────────────────────────────────────────────── */
export const Character: React.FC<CharacterProps> = ({
  character = "pip",
  expression = "neutral",
  size = "md",
  accessory = "none",
  speechBubble,
  bubblePosition = "top",
  className,
}) => {
  const px = SIZE_MAP[size];

  // Dynamic tilt for lively animation
  const tiltDeg =
    expression === "celebrating"
      ? 8
      : expression === "encouraging" || expression === "hello"
        ? -5
        : expression === "studying"
          ? 3
          : expression === "thinking"
            ? 4
            : 0;

  const renderMascot = () => {
    switch (character) {
      case "milo":
        return <MiloMascot expression={expression} />;
      case "lumi":
        return <LumiMascot expression={expression} />;
      case "barnaby":
        return <BarnabyMascot expression={expression} />;
      case "toby":
        return <TobyMascot expression={expression} />;
      case "zara":
        return <ZaraMascot expression={expression} />;
      case "pip":
      default:
        return <PipMascot expression={expression} />;
    }
  };

  return (
    <div
      className={clsx(
        "relative inline-flex items-center justify-center select-none",
        className
      )}
    >
      {/* Optional Speech Bubble */}
      {speechBubble && (
        <div
          className={clsx(
            "absolute z-10 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm whitespace-nowrap pointer-events-none transition-all duration-200",
            bubblePosition === "top" && "-top-8 left-1/2 -translate-x-1/2",
            bubblePosition === "right" && "left-full ml-2 top-1/4",
            bubblePosition === "left" && "right-full mr-2 top-1/4"
          )}
        >
          {speechBubble}
          {/* Arrow */}
          {bubblePosition === "top" && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-800" />
          )}
          {bubblePosition === "right" && (
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white dark:border-r-slate-800" />
          )}
          {bubblePosition === "left" && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-white dark:border-l-slate-800" />
          )}
        </div>
      )}

      {/* SVG Canvas (100x100 coordinate space) */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
        aria-label={`${CHARACTER_META[character]?.name || "Pip"} — ${expression}`}
        role="img"
      >
        <g
          style={{
            transformOrigin: "50px 85px",
            transform: `rotate(${tiltDeg}deg)`,
            transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Mascot Body & Face */}
          {renderMascot()}

          {/* Equipped Accessory Overlay */}
          <RenderAccessory accessory={accessory} />
        </g>
      </svg>
    </div>
  );
};

export default Character;
