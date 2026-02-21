export const TYPE_COLORS: Record<string, { border: string; bg: string; badge: string; badgeText: string }> = {
  Passive: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-400",
    badgeText: "Passive",
  },
  Primary: {
    border: "border-l-blue-500",
    bg: "bg-blue-500/5",
    badge: "bg-blue-500/15 text-blue-400",
    badgeText: "Primary",
  },
  Secondary: {
    border: "border-l-indigo-500",
    bg: "bg-indigo-500/5",
    badge: "bg-indigo-500/15 text-indigo-400",
    badgeText: "Secondary",
  },
  Defense: {
    border: "border-l-amber-500",
    bg: "bg-amber-500/5",
    badge: "bg-amber-500/15 text-amber-400",
    badgeText: "Defense",
  },
  Ultimate: {
    border: "border-l-purple-500",
    bg: "bg-purple-500/5",
    badge: "bg-purple-500/15 text-purple-400",
    badgeText: "Ultimate",
  },
  Other: {
    border: "border-l-gray-500",
    bg: "bg-gray-500/5",
    badge: "bg-gray-500/15 text-gray-400",
    badgeText: "Other",
  },
};

export function getTypeColor(type: string | undefined) {
  return TYPE_COLORS[type || "Other"] || TYPE_COLORS.Other;
}
