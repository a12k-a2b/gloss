import { illustrateTerm } from "@/lib/ai";
import { figureKey, loadFigure, saveFigure } from "@/lib/figure-store";
import { isOnline } from "@/lib/online";
import type { DiagramSpec } from "@/lib/types";

export type DrawResult =
  | { ok: true; url: string }
  | { ok: false; error: string; offline?: boolean };

const memory = new Map<string, string>();

function panelsFrom(diagram?: DiagramSpec, analogy = ""): string[] {
  const nodes = diagram?.lanes?.[0]?.nodes ?? [];
  const labels = nodes
    .map((n) => n.label.replace(/\\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (labels.length >= 2) return labels.slice(0, 3);
  if (labels.length === 1) return [labels[0], analogy || "what changes"];
  return [];
}

export async function drawTerm(
  term: string,
  analogy: string,
  explanation: string,
  context = "",
  diagram?: DiagramSpec,
  persistKey?: string,
): Promise<DrawResult> {
  const memKey = persistKey ?? `${term.toLowerCase()}::${analogy.slice(0, 40)}`;
  const hit = memory.get(memKey);
  if (hit) return { ok: true, url: hit };
  if (persistKey) {
    const stored = await loadFigure(persistKey);
    if (stored) {
      memory.set(memKey, stored);
      return { ok: true, url: stored };
    }
  }
  if (!isOnline()) {
    return {
      ok: false,
      offline: true,
      error: "Connect to draw this figure. The ink diagram above still works.",
    };
  }
  const panels = panelsFrom(diagram, analogy);
  const result = await illustrateTerm({
    data: {
      term,
      analogy,
      explanation,
      context,
      panels,
      caption: diagram?.caption,
    },
  });
  if (result.ok) {
    memory.set(memKey, result.url);
    if (persistKey) void saveFigure(persistKey, result.url);
  }
  return result;
}

export async function prewarmBoards(
  articleId: string,
  terms: { id: string; term: string; analogy: string; explanation: string; context: string; diagram?: DiagramSpec }[],
  limit = 6,
): Promise<void> {
  if (!isOnline()) return;
  for (const t of terms.slice(0, limit)) {
    if (!isOnline()) return;
    await drawTerm(
      t.term,
      t.analogy,
      t.explanation,
      t.context,
      t.diagram,
      figureKey(articleId, t.id),
    ).catch(() => undefined);
  }
}
