import type { AnalysisResult } from "@/lib/ai";
import { localExplain } from "@/lib/explain";

const STOP = new Set(
  `a an the and or but if then than of to in on for with from as at by into over after before
   is are was were be been being this that these those it its they them their you your we our
   i me my he she his her not no yes so too very just also only can could would should will
   about into out up down off more most some any all each other another such than when where
   who what which how why because while during without within between among across per via
   like unlike using used use one two three first second new old own same both few many
   there here been have has had do does did doing done get got make made may might must
   shall through until unless though although even still already yet again never always
   something anything everything nothing someone anyone everyone`.split(/\s+/),
);

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "term"
  );
}

function scoreTerm(raw: string, freq: number): number {
  let score = freq * 2;
  if (/^[A-Z]{2,6}$/.test(raw)) score += 8;
  if (/[A-Z][a-z]+[A-Z]/.test(raw)) score += 7;
  if (raw.includes("-") && /[A-Za-z]/.test(raw)) score += 4;
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(raw)) score += 6;
  if (raw.length >= 8) score += 2;
  if (STOP.has(raw.toLowerCase())) return 0;
  if (/['’]/.test(raw) && raw.replace(/['’][a-z]+$/i, "").length <= 2) return 0;
  if (freq === 1 && /^[A-Z][a-z]+$/.test(raw) && raw.length < 8) score -= 5;
  return score;
}

export function localAnalyze(title: string, text: string): AnalysisResult {
  const counts = new Map<string, { display: string; n: number }>();
  const wordRe =
    /\b([A-Z]{2,6}|[A-Z][a-z]+(?:[A-Z][a-z]+)+|[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]{2,}){0,2}|[A-Za-z][A-Za-z0-9]+(?:-[A-Za-z0-9]+)+)\b/g;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(text))) {
    const display = m[1] ?? "";
    const key = display.toLowerCase();
    if (STOP.has(key) || display.length < 3) continue;
    const prev = counts.get(key);
    if (prev) prev.n += 1;
    else counts.set(key, { display, n: 1 });
  }

  const ranked = [...counts.values()]
    .map((c) => ({ ...c, score: scoreTerm(c.display, c.n) }))
    .filter((c) => c.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 18);

  const dek =
    text
      .replace(/\s+/g, " ")
      .trim()
      .split(/(?<=[.!?])\s+/)
      .find((s) => s.length > 40)
      ?.slice(0, 180) ?? "A passage you brought in.";

  const terms = ranked.map((c) => {
    const note = localExplain({
      phrase: c.display,
      kind: c.display.includes(" ") ? "phrase" : "word",
      title,
      surrounding: text.slice(0, 1800),
    });
    return {
      term: c.display,
      aliases: [],
      gloss: note.gloss,
      explanation: note.explanation,
      analogy: note.analogy,
      context: note.context,
      excerpt: note.excerpt,
      related: [] as string[],
      diagram: note.diagram,
    };
  });

  if (terms.length === 0) {
    const fallback = localExplain({
      phrase: title,
      kind: "word",
      title,
      surrounding: text.slice(0, 800),
    });
    terms.push({
      term: title,
      aliases: [],
      gloss: fallback.gloss,
      explanation: fallback.explanation,
      analogy: fallback.analogy,
      context: fallback.context,
      excerpt: fallback.excerpt,
      related: [],
      diagram: fallback.diagram,
    });
  }

  return { title, dek, terms };
}

export { slug };
