import { analyzePassage, explainSpan as explainSpanFn } from "@/lib/ai";
import type { AnalysisResult } from "@/lib/ai";
import { localExplain, type ExplainInput, type ExplainResult } from "@/lib/explain";
import { localAnalyze } from "@/lib/local-teach";
import type { Term } from "@/lib/types";

export type TeachResult =
  | { ok: true; analysis: AnalysisResult }
  | { ok: false; error: string };

export async function teachPassage(
  title: string,
  text: string,
): Promise<TeachResult> {
  try {
    const result = await analyzePassage({ data: { title, text } });
    if (result.ok) return result;
  } catch {
    /* fall through to the pocket teacher */
  }
  return { ok: true, analysis: localAnalyze(title, text) };
}

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "ask"
  );
}

export async function explainSpan(input: ExplainInput): Promise<ExplainResult> {
  try {
    const result = await explainSpanFn({ data: input });
    if (!result.ok) {
      return { ok: true, term: localExplain(input) };
    }
    const raw = result.term;
    const term: Term = {
      id: `ask-${slug(input.phrase)}`,
      term: raw.term,
      aliases: raw.aliases ?? [],
      gloss: raw.gloss,
      explanation: raw.explanation,
      analogy: raw.analogy,
      context: raw.context,
      excerpt: raw.excerpt,
      related: raw.related ?? [],
      diagram: raw.diagram,
      source: "asked",
    };
    return { ok: true, term };
  } catch {
    return { ok: true, term: localExplain(input) };
  }
}
