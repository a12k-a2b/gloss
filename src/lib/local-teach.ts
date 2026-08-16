import type { AnalysisResult } from "@/lib/ai";
import { isCommonEnglish } from "@/lib/common-english";
import { localExplain } from "@/lib/explain";
import { FIELD_LABEL, inferField, readerStance } from "@/lib/fields";
import { unitsInPassage } from "@/lib/unit-lexicon";

const LEARNED = /(?:ology|onomy|ography|opathy|ectomy|itis|osis|oma|icity|ization|isation|ential|ential|ulence|escence|hedron)$/i;
const LEARNED_PREFIX = /^(?:pseudo|proto|meta|hyper|hypo|poly|mono|multi|neo|anti|auto|iso|hetero|homo|intra|inter|trans|neuro|cardio|onco|cyto|geno|photo|thermo)/i;

function scoreSurface(raw: string, freq: number): number {
  const lower = raw.toLowerCase();
  if (isCommonEnglish(lower)) return 0;
  if (/['’]/.test(raw) && raw.replace(/['’][a-z]+$/i, "").length <= 2) return 0;
  let score = freq * 2;
  if (/^[A-Z]{2,6}$/.test(raw)) score += 8;
  if (/[A-Z][a-z]+[A-Z]/.test(raw)) score += 7;
  if (raw.includes("-") && /[A-Za-z]/.test(raw)) score += 5;
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(raw)) score += 6;
  if (raw.includes(" ") && !raw.split(/\s+/).every(isCommonEnglish)) score += 5;
  if (raw.length >= 9 && !isCommonEnglish(lower)) score += 3;
  if (LEARNED.test(lower) || LEARNED_PREFIX.test(lower)) score += 5;
  if (freq === 1 && /^[A-Z][a-z]+$/.test(raw) && raw.length < 8) score -= 6;
  return score;
}

function add(
  map: Map<string, { display: string; n: number; bonus: number }>,
  display: string,
  bonus = 0,
) {
  const key = display.toLowerCase().replace(/\s+/g, " ").trim();
  if (key.length < 3 || isCommonEnglish(key)) return;
  const prev = map.get(key);
  if (prev) {
    prev.n += 1;
    prev.bonus = Math.max(prev.bonus, bonus);
  } else {
    map.set(key, { display: display.trim(), n: 1, bonus });
  }
}

export function localAnalyze(title: string, text: string): AnalysisResult {
  const field = inferField(title, text);
  const counts = new Map<string, { display: string; n: number; bonus: number }>();

  const wordRe =
    /\b([A-Z]{2,6}|[A-Z][a-z]+(?:[A-Z][a-z]+)+|[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+|[A-Za-z][A-Za-z]{6,})\b/g;
  let m: RegExpExecArray | null;
  while ((m = wordRe.exec(text))) add(counts, m[1] ?? "");

  const phraseRe = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,3})\b/g;
  while ((m = phraseRe.exec(text))) add(counts, m[1] ?? "", 3);

  const definedRe =
    /\b(?:called|known as|termed|named|meaning)\s+["“]?([A-Za-z][A-Za-z0-9-]{2,}(?:\s+[A-Za-z][A-Za-z0-9-]{2,}){0,3})/gi;
  while ((m = definedRe.exec(text))) add(counts, m[1] ?? "", 8);

  const parenRe =
    /\b([A-Za-z][A-Za-z0-9-]{2,}(?:\s+[A-Za-z][A-Za-z0-9-]{2,}){0,2})\s+\(([^)]{2,40})\)/g;
  while ((m = parenRe.exec(text))) {
    add(counts, m[1] ?? "", 4);
    add(counts, m[2] ?? "", 4);
  }

  for (const unit of unitsInPassage(text)) add(counts, unit, 12);

  const ranked = [...counts.values()]
    .map((c) => ({
      ...c,
      score: scoreSurface(c.display, c.n) + c.bonus,
    }))
    .filter((c) => c.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

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

  return {
    title,
    dek,
    field: FIELD_LABEL[field],
    reader: readerStance(field),
    terms,
  };
}
