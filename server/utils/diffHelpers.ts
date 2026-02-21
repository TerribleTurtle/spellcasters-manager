import { logger } from "./logger.js";

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Applies the inverse of a single deep-diff entry to an object, mutating it in place.
 * Supports N (new→delete), D (deleted→restore), E (edit→revert), A (array).
 *
 * @param obj - The target object to mutate
 * @param d - A deep-diff descriptor with `{ kind, path, lhs, rhs, index?, item? }`
 * @returns void — the object is mutated in place
 *
 * @example
 * applyInverseDiff(entity, { kind: 'E', path: ['hp'], lhs: 100, rhs: 120 });
 * // entity.hp is now 100
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyInverseDiff(obj: any, d: any): void {
  if (!d.path || d.path.length === 0) return;

  // Navigate to parent
  let current = obj;
  for (let i = 0; i < d.path.length - 1; i++) {
    const key = d.path[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = typeof d.path[i + 1] === "number" ? [] : {};
    }
    current = current[key];
  }

  const lastKey = d.path[d.path.length - 1];

  switch (d.kind) {
    case "E": // Edit → revert to old value
      current[lastKey] = d.lhs;
      break;
    case "N": // New field → delete it
      delete current[lastKey];
      break;
    case "D": // Deleted field → restore it
      current[lastKey] = d.lhs;
      break;
    case "A": // Array change → apply inverse recursively
      if (d.item) {
        if (d.item.kind === "N") {
          // Item was added → remove it
          if (Array.isArray(current[lastKey])) {
            current[lastKey].splice(d.index, 1);
          }
        } else if (d.item.kind === "D") {
          // Item was deleted → add it back
          if (Array.isArray(current[lastKey])) {
            current[lastKey].splice(d.index, 0, d.item.lhs);
          }
        } else if (d.item.kind === "E") {
          // Item was edited → revert
          if (Array.isArray(current[lastKey])) {
            current[lastKey][d.index] = d.item.lhs;
          }
        }
      }
      break;
  }
}

/**
 * Applies a change to an object at a dot-separated path.
 * Returns the modified object.
 * Includes prototype-pollution protection.
 *
 * @param obj - The target object to modify
 * @param pathStr - Dot-separated path to the field (e.g. 'stats.hp') or 'ROOT' for full replacement
 * @param value - The new value to set, or `undefined` to delete the field
 * @returns The modified object
 *
 * @example
 * applyChangeToObject({ stats: { hp: 100 } }, 'stats.hp', 120);
 * // => { stats: { hp: 120 } }
 */
export function applyChangeToObject(
  obj: Record<string, unknown>,
  pathStr: string,
  value: unknown
): Record<string, unknown> {
  if (!pathStr || pathStr === "ROOT") return value as Record<string, unknown>;

  const parts = pathStr.split(".");

  // SECURITY: Reject paths that target prototype chain
  if (parts.some((p) => DANGEROUS_KEYS.has(p))) {
    logger.warn(
      `[Security] Blocked prototype pollution attempt via path: ${pathStr}`
    );
    return obj;
  }

  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const last = parts[parts.length - 1];
  if (value === undefined) {
    delete current[last];
  } else {
    current[last] = value;
  }

  return obj;
}
