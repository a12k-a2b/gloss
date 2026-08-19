import type { Term } from "@/lib/types";

function tidy(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function sentences(s: string): string[] {
  const parts = tidy(s)
    .split(/(?<=[.!?])\s+(?=[A-Z“"])/)
    .map(tidy)
    .filter(Boolean);
  return parts.length ? parts : tidy(s) ? [tidy(s)] : [];
}

/** One or two sentences for the margin card. Enough to stay in the essay. */
export function termTldr(term: Term): string {
  const gloss = tidy(term.gloss);
  const expl = sentences(term.explanation);
  if (expl.length >= 2) return `${expl[0]} ${expl[1]}`;
  if (expl[0] && expl[0].length >= 70) {
    if (gloss && !expl[0].toLowerCase().includes(gloss.slice(0, 18).toLowerCase())) {
      return `${gloss} ${expl[0]}`;
    }
    return expl[0];
  }
  if (gloss && expl[0]) return `${gloss} ${expl[0]}`;
  return gloss || expl[0] || "";
}
