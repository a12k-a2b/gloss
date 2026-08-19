import { bringPage } from "@/lib/bring";
import { flattenBlocks } from "@/lib/parse-import";
import { isOnline } from "@/lib/online";
import { prewarmBoards } from "@/lib/illustrate";
import { teachPassage } from "@/lib/teach";
import type { Article, Term } from "@/lib/types";
import { useReader } from "@/store/reader";
import type { AnalysisResult } from "@/lib/ai";

export type IngestTiming = {
  fetchMs: number;
  teachMs: number;
  firstMs?: number;
  restMs?: number;
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

export function firstWindow(text: string, max = 2200): string {
  const paras = text.split(/\n{2,}/);
  let out = "";
  for (const p of paras) {
    if (out.length >= 900 && out.length + p.length > max) break;
    out = out ? `${out}\n\n${p}` : p;
    if (out.length >= max) break;
  }
  return (out || text).slice(0, max);
}

export function analysisToTerms(raw: AnalysisResult["terms"]): Term[] {
  const used = new Set<string>();
  return raw.map((t) => {
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
}

export async function teachArticleInStages(articleId: string): Promise<{
  firstMs: number;
  restMs: number;
  terms: number;
}> {
  const store = useReader.getState();
  const article = store.customArticles.find((a) => a.id === articleId);
  if (!article) return { firstMs: 0, restMs: 0, terms: 0 };
  store.setTeaching(articleId);
  const flat = flattenBlocks(article.blocks);
  const opening = firstWindow(flat);

  const t0 = performance.now();
  const first = await teachPassage(article.title, opening, "opening");
  const firstMs = Math.round(performance.now() - t0);
  if (first.ok) {
    const terms = analysisToTerms(first.analysis.terms);
    store.mergeTerms(articleId, terms, {
      title: first.analysis.title,
      dek: first.analysis.dek,
      field: first.analysis.field,
    });
    if (isOnline() && terms.length) void prewarmBoards(articleId, terms);
  }

  const t1 = performance.now();
  const rest = await teachPassage(article.title, flat.slice(0, 16000), "full");
  const restMs = Math.round(performance.now() - t1);
  if (rest.ok) {
    const terms = analysisToTerms(rest.analysis.terms);
    store.mergeTerms(articleId, terms, {
      title: rest.analysis.title,
      dek: rest.analysis.dek,
      field: rest.analysis.field,
    });
    if (isOnline() && terms.length) void prewarmBoards(articleId, terms);
  }

  store.setTeaching(null);
  const latest = useReader.getState().customArticles.find((a) => a.id === articleId);
  return { firstMs, restMs, terms: latest?.terms.length ?? 0 };
}

function articleFromPage(page: {
  title: string;
  dek: string;
  source: string;
  url: string;
  blocks: Article["blocks"];
  origin?: Article["origin"];
}): Article {
  const flat = flattenBlocks(page.blocks);
  return {
    id: `custom-${Date.now()}`,
    title: page.title,
    dek: page.dek,
    source: page.source,
    minutes: Math.max(1, Math.round(flat.split(/\s+/).length / 220)),
    custom: true,
    url: page.url,
    addedAt: Date.now(),
    origin: page.origin,
    blocks: page.blocks,
    terms: [],
  };
}

export async function ingestAndOpen(
  href: string,
): Promise<
  | { ok: true; article: Article; timing: IngestTiming }
  | { ok: false; error: string; timing: IngestTiming }
> {
  const t0 = performance.now();
  const brought = await bringPage(href);
  const fetchMs = Math.round(performance.now() - t0);
  if (!brought.ok) return { ...brought, timing: { fetchMs, teachMs: 0 } };
  const article = articleFromPage(brought.page);
  useReader.getState().addArticle(article);
  void teachArticleInStages(article.id);
  return {
    ok: true,
    article,
    timing: {
      fetchMs,
      teachMs: 0,
    },
  };
}

/** @deprecated prefer ingestAndOpen — kept for callers that add the article themselves */
export async function ingestUrl(
  href: string,
): Promise<
  | { ok: true; article: Article; timing: IngestTiming }
  | { ok: false; error: string; timing: IngestTiming }
> {
  return ingestAndOpen(href);
}
