import { isCommonEnglish } from "@/lib/common-english";
import type { Term } from "@/lib/types";

/**
 * Precision on the automatic underlines. Recall on the tap-to-ask path.
 *
 * A false underline on a paper screen is expensive: it spends the only
 * visual signal, and it teaches the wrong unit if we mark "process" when
 * the idea is "due process". A missed underline is cheap — double-tap.
 *
 * So: keep the longest real unit, hang the acronym on it as an alias,
 * drop short ambiguous English unless it is the whole concept.
 */

export type UnitPair = { long: string; short: string };

const AMBIGUOUS_ALONE = new Set(
  `work train charge interest demand expression process action right case party
   power force matter order record service value return account note brief
   motion appeal holding offer stock share plant`.split(/\s+/),
);

export function harvestPairs(text: string): UnitPair[] {
  const out: UnitPair[] = [];
  const longThenShort =
    /\b([A-Za-z][A-Za-z0-9-]{2,}(?:\s+[A-Za-z][A-Za-z0-9-]{2,}){0,5})\s+\(([A-Z]{2,8})s?\)/g;
  const shortThenLong =
    /\b(?:([a-z]+)\s+)?([A-Z]{2,8})s?\s+\(((?:[A-Za-z][A-Za-z0-9-]{2,}(?:\s+[A-Za-z][A-Za-z0-9-]{2,}){0,5}))\)/g;
  let m: RegExpExecArray | null;
  while ((m = longThenShort.exec(text))) {
    out.push({ long: clean(m[1] ?? ""), short: m[2] ?? "" });
  }
  while ((m = shortThenLong.exec(text))) {
    const modifier = m[1] ?? "";
    const short = m[2] ?? "";
    const long = clean(m[3] ?? "");
    out.push({ long, short });
    if (modifier && short) {
      out.push({ long: `${modifier} ${short}`, short });
      out.push({ long: `${modifier} ${short}`, short: long });
    }
  }
  return out.filter((p) => p.long.length >= 4 && p.short.length >= 2);
}

function clean(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function words(s: string) {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function containsUnit(longer: string, shorter: string) {
  const a = words(longer);
  const b = words(shorter);
  if (b.length === 0 || a.length <= b.length) return false;
  return a.join(" ").includes(b.join(" "));
}

type Loose = {
  term: string;
  aliases: string[];
};

export function refineTaughtTerms<T extends Loose>(terms: T[], passage: string): T[] {
  const pairs = harvestPairs(passage);
  const next = terms.map((t) => ({
    ...t,
    aliases: [...t.aliases],
  }));

  for (const pair of pairs) {
    const host = next.find((t) => {
      const bag = [t.term, ...t.aliases].map((s) => s.toLowerCase());
      return (
        bag.includes(pair.long.toLowerCase()) ||
        bag.includes(pair.short.toLowerCase())
      );
    });
    if (host) {
      if (host.term.toLowerCase() === pair.short.toLowerCase()) {
        host.term = pair.long;
      }
      for (const extra of [pair.long, pair.short]) {
        if (
          extra.toLowerCase() !== host.term.toLowerCase() &&
          !host.aliases.some((a) => a.toLowerCase() === extra.toLowerCase())
        ) {
          host.aliases.push(extra);
        }
      }
    }
  }

  const kept: T[] = [];
  const eaten = new Set<number>();
  for (let i = 0; i < next.length; i++) {
    if (eaten.has(i)) continue;
    const a = next[i];
    for (let j = 0; j < next.length; j++) {
      if (i === j || eaten.has(j)) continue;
      const b = next[j];
      if (containsUnit(a.term, b.term) || a.aliases.some((al) => containsUnit(al, b.term))) {
        if (!a.aliases.some((al) => al.toLowerCase() === b.term.toLowerCase())) {
          a.aliases.push(b.term);
        }
        for (const al of b.aliases) {
          if (!a.aliases.some((x) => x.toLowerCase() === al.toLowerCase())) {
            a.aliases.push(al);
          }
        }
        eaten.add(j);
      }
    }
  }

  for (let i = 0; i < next.length; i++) {
    if (eaten.has(i)) continue;
    const t = next[i];
    const key = t.term.toLowerCase();
    const alone = !t.term.includes(" ") && !t.term.includes("-");
    if (alone && AMBIGUOUS_ALONE.has(key) && t.aliases.length === 0) continue;
    if (alone && isCommonEnglish(key) && t.term.length < 8) continue;
    kept.push(t);
  }

  return kept.length > 0 ? kept : next.slice(0, 1);
}

export function snapUnit(
  phrase: string,
  surrounding: string,
  terms: Array<{ term: string; aliases: string[]; id?: string }>,
): { text: string; termId?: string } {
  const needle = phrase.trim();
  if (!needle) return { text: phrase };

  const lower = needle.toLowerCase();
  for (const t of terms) {
    if (t.term.toLowerCase() === lower) return { text: t.term, termId: t.id };
    if (t.aliases.some((a) => a.toLowerCase() === lower)) {
      return { text: t.term, termId: t.id };
    }
  }

  for (const t of terms) {
    const forms = [t.term, ...t.aliases];
    for (const form of forms) {
      if (form.toLowerCase().includes(lower) && surrounding.toLowerCase().includes(form.toLowerCase())) {
        return { text: t.term, termId: t.id };
      }
    }
  }

  const pairs = harvestPairs(surrounding);
  for (const pair of pairs) {
    if (
      pair.short.toLowerCase() === lower ||
      pair.long.toLowerCase() === lower ||
      pair.long.toLowerCase().includes(lower)
    ) {
      return { text: pair.long };
    }
  }

  return { text: phrase };
}
