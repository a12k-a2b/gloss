import { illustrateTerm } from "@/lib/ai";
import type { DiagramSpec } from "@/lib/types";

export type DrawResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const cache = new Map<string, string>();

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
): Promise<DrawResult> {
  const panels = panelsFrom(diagram, analogy);
  const key = `${term.toLowerCase()}::${panels.join("|")}::${analogy.slice(0, 40)}`;
  const hit = cache.get(key);
  if (hit) return { ok: true, url: hit };
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
  if (result.ok) cache.set(key, result.url);
  return result;
}
