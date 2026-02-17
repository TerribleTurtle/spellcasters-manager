import { MagicSchool } from "@/domain/schemas";

export interface SchoolTheme {
  bg: string;     // Badge background
  text: string;   // Badge text
  border: string; // Card border
  gradient: string; // Header gradient
  icon: string;   // Icon color
}

// Fallback theme
const DEFAULT_THEME: SchoolTheme = {
  bg: "bg-slate-700",
  text: "text-slate-100",
  border: "border-slate-600",
  gradient: "from-slate-800 to-slate-900",
  icon: "text-slate-400"
};

export const SCHOOL_THEMES: Record<MagicSchool | string, SchoolTheme> = {
  'Astral': {
    bg: "bg-fuchsia-600",
    text: "text-white",
    border: "border-fuchsia-400/50",
    gradient: "from-fuchsia-900/80 to-purple-900/80",
    icon: "text-fuchsia-400"
  },
  'Elemental': {
    bg: "bg-orange-600", 
    text: "text-white",
    border: "border-orange-400/50",
    gradient: "from-orange-900/80 to-red-900/80",
    icon: "text-orange-400"
  },
  'Holy': {
    bg: "bg-yellow-500",
    text: "text-yellow-950", 
    border: "border-yellow-400/50",
    gradient: "from-yellow-900/60 to-amber-900/60",
    icon: "text-yellow-400"
  },
  'Necromancy': {
    bg: "bg-lime-600", 
    text: "text-white",
    border: "border-lime-400/50",
    gradient: "from-lime-900/80 to-green-900/80",
    icon: "text-lime-400"
  },
  'Technomancy': {
    bg: "bg-pink-600", 
    text: "text-white",
    border: "border-pink-400/50",
    gradient: "from-pink-900/80 to-rose-900/80",
    icon: "text-pink-400"
  },
  'War': {
    bg: "bg-red-700",
    text: "text-white",
    border: "border-red-500/50",
    gradient: "from-red-900/80 to-rose-950/80",
    icon: "text-red-400"
  },
  'Wild': {
    bg: "bg-emerald-600",
    text: "text-white",
    border: "border-emerald-400/50",
    gradient: "from-emerald-900/80 to-green-900/80",
    icon: "text-emerald-400"
  },
  'Titan': {
    bg: "bg-violet-600",
    text: "text-white",
    border: "border-violet-400/50",
    gradient: "from-violet-950 to-indigo-950",
    icon: "text-violet-300"
  }
};

export function getSchoolTheme(school?: string): SchoolTheme {
  return SCHOOL_THEMES[school || ''] || DEFAULT_THEME;
}
