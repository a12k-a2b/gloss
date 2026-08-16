import { bringPage } from "@/lib/bring";
import { flattenBlocks } from "@/lib/parse-import";
import { teachPassage } from "@/lib/teach";
import type { Article, Term } from "@/lib/types";

export type IngestTiming = {
  fetchMs: number;
  teachMs: number;
};

function slugId(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "passage"
  );
}

function termId(term: string) {
  return slugId(term) || `term-${Math.random().toString(36).slice(2, 8)}`;
}

export function extractSharedUrl(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const found = text.match(/https?:\/\/[^\s<>"']+/i);
  if (found?.[0]) {
    return found[0].replace(/[),.;!?]+$/g, "");
  }
  if (/^(www\.)?[\w.-]+\.[a-z]{2,}([/:?#]\S*)?$/i.test(text) && !/\s/.test(text)) {
    return `https://${text.replace(/^\/\//, "")}`;
  }
  return null;
}

export async function ingestUrl(
  href: string,
): Promise<
  | { ok: true; article: Article; timing: IngestTiming }
  | { ok: false; error: string; timing: IngestTiming }
> {
  const t0 = performance.now();
  const brought = await bringPage(href);
  const fetchMs = Math.round(performance.now() - t0);
  if (!brought.ok) return { ...brought, timing: { fetchMs, teachMs: 0 } };
  const page = brought.page;
  const flat = flattenBlocks(page.blocks);
  const t1 = performance.now();
  const taught = await teachPassage(page.title, flat.slice(0, 16000));
  const teachMs = Math.round(performance.now() - t1);
  if (!taught.ok) return { ...taught, timing: { fetchMs, teachMs } };
  const used = new Set<string>();
  const terms: Term[] = taught.analysis.terms.map((t) => {
    let id = termId(t.term);
    let n = 2;
    while (used.has(id)) id = `${termId(t.term)}-${n++}`;
    used.add(id);
    return {
      id,
      term: t.term,
      aliases: t.aliases ?? [],
      gloss: t.gloss,
      explanation: t.explanation,
      analogy: t.analogy,
      context: t.context,
      excerpt: t.excerpt,
      related: t.related ?? [],
      diagram: t.diagram,
      source: "auto" as const,
    };
  });
  return {
    ok: true,
    timing: { fetchMs, teachMs },
    article: {
      id: `custom-${Date.now()}`,
      title: taught.analysis.title || page.title,
      dek: taught.analysis.dek || page.dek,
      source: page.source,
      minutes: Math.max(1, Math.round(flat.split(/\s+/).length / 220)),
      custom: true,
      url: page.url,
      addedAt: Date.now(),
      field: taught.analysis.field,
      origin: page.origin,
      blocks: page.blocks,
      terms,
    },
  };
}
