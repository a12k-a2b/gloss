import type { Term } from "@/lib/types";

const KEY = "gloss-known-v1";

export function normalizeKnown(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function surfacesFor(term: Pick<Term, "term" | "aliases">): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [term.term, ...term.aliases]) {
    const key = normalizeKnown(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(raw.trim());
  }
  return out;
}

export function termIsKnown(
  term: Pick<Term, "term" | "aliases">,
  known: string[],
): boolean {
  if (known.length === 0) return false;
  const have = new Set(known.map(normalizeKnown));
  return surfacesFor(term).some((s) => have.has(normalizeKnown(s)));
}

export function loadKnown(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

export function saveKnown(known: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(known));
  } catch {
    /* quota */
  }
}

export function uniqueKnown(known: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of known) {
    const key = normalizeKnown(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}
