import type { Article, Block, Term } from "@/lib/types";

export type TextPart =
  | { type: "text"; value: string }
  | { type: "term"; value: string; term: Term };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function collectNeedles(term: Term): string[] {
  return [term.term, ...term.aliases]
    .map((s) => s.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

export function splitByTerms(
  text: string,
  terms: Term[],
  claimed?: Set<string>,
): TextPart[] {
  if (!text || terms.length === 0) return [{ type: "text", value: text }];

  const catalog: { needle: string; term: Term }[] = [];
  for (const term of terms) {
    for (const needle of collectNeedles(term)) {
      catalog.push({ needle, term });
    }
  }
  catalog.sort((a, b) => b.needle.length - a.needle.length);
  if (catalog.length === 0) return [{ type: "text", value: text }];

  const pattern = catalog
    .map(({ needle }) => {
      const escaped = escapeRegExp(needle);
      if (/^[A-Za-z0-9]/.test(needle) && /[A-Za-z0-9]$/.test(needle)) {
        return `\\b${escaped}\\b`;
      }
      return escaped;
    })
    .join("|");

  const re = new RegExp(pattern, "gi");
  const parts: TextPart[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const seen = claimed ?? new Set<string>();

  while ((match = re.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    if (start > last) {
      parts.push({ type: "text", value: text.slice(last, start) });
    }
    const found =
      catalog.find((c) => c.needle.toLowerCase() === raw.toLowerCase()) ??
      catalog.find((c) => raw.toLowerCase().includes(c.needle.toLowerCase()));
    if (found && !seen.has(found.term.id)) {
      parts.push({ type: "term", value: raw, term: found.term });
      seen.add(found.term.id);
    } else {
      parts.push({ type: "text", value: raw });
    }
    last = start + raw.length;
  }
  if (last < text.length) {
    parts.push({ type: "text", value: text.slice(last) });
  }
  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

export function firstExcerpt(text: string, term: Term, window = 140): string {
  const needles = collectNeedles(term);
  const lower = text.toLowerCase();
  for (const needle of needles) {
    const i = lower.indexOf(needle.toLowerCase());
    if (i >= 0) {
      const start = Math.max(0, i - 40);
      const end = Math.min(text.length, i + needle.length + window - 40);
      let slice = text.slice(start, end).trim();
      if (start > 0) slice = "…" + slice;
      if (end < text.length) slice = slice + "…";
      return slice;
    }
  }
  return text.slice(0, window).trim();
}

export type MarkedBlock =
  | { type: "h1" | "h2" | "h3" | "p" | "quote"; parts: TextPart[] }
  | { type: "list"; ordered: boolean; items: TextPart[][] }
  | { type: "code"; text: string }
  | { type: "table"; headers: TextPart[][]; rows: TextPart[][][] }
  | { type: "note"; kind: "note" | "tip" | "warning"; parts: TextPart[] };

export function markArticle(article: Article): MarkedBlock[] {
  const claimed = new Set<string>();
  return article.blocks.map((block: Block): MarkedBlock => {
    if (block.type === "list") {
      return {
        type: "list",
        ordered: block.ordered,
        items: block.items.map((item) =>
          splitByTerms(item, article.terms, claimed),
        ),
      };
    }
    if (block.type === "code") {
      return { type: "code", text: block.text };
    }
    if (block.type === "table") {
      return {
        type: "table",
        headers: block.headers.map((h) =>
          splitByTerms(h, article.terms, claimed),
        ),
        rows: block.rows.map((row) =>
          row.map((cell) => splitByTerms(cell, article.terms, claimed)),
        ),
      };
    }
    if (block.type === "note") {
      return {
        type: "note",
        kind: block.kind,
        parts: splitByTerms(block.text, article.terms, claimed),
      };
    }
    return {
      type: block.type,
      parts: splitByTerms(block.text, article.terms, claimed),
    };
  });
}
