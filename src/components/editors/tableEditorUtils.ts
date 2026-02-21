export type RowStatus = "clean" | "modified" | "schema-missing";

export function getRowStatus(initialValue: unknown, currentValue: unknown): RowStatus {
  // Normalize empty values to null for comparison
  const normalize = (v: unknown) =>
    v === undefined || v === null || v === "" ? null : v;

  const v1 = normalize(initialValue);
  const v2 = normalize(currentValue);

  // If both are empty, it's clean
  if (v1 === null && v2 === null) return "clean";

  // Schema-missing: the field isn't in the JSON at all (initial is undefined/null) AND user hasn't touched it (current is null)
  if (initialValue === undefined) {
    // If user has set a value, it's a "New Field" that is also being edited.
    return v2 !== null ? "schema-missing" : "clean";
  }

  // Loose equality for numbers/strings (e.g. 1 == "1") but strict for nulls
  // If v1 is number, try to cast v2
  if (typeof v1 === "number" && typeof v2 === "string") {
    if (v2 === "" && v1 === 0) return "modified"; // 0 -> ""
    return v1 === Number(v2) ? "clean" : "modified";
  }

  return v1 == v2 ? "clean" : "modified";
}

export const STATUS_STYLES: Record<
  RowStatus,
  { input: string; badge: string; badgeText: string }
> = {
  clean: {
    input: "",
    badge: "",
    badgeText: "",
  },
  modified: {
    input: "border-amber-500/50 focus-visible:ring-amber-500/20",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    badgeText: "Edited",
  },
  "schema-missing": {
    input: "border-cyan-500/50 focus-visible:ring-cyan-500/20",
    badge: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    badgeText: "New Field",
  },
};
