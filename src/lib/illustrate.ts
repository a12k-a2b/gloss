import { illustrateTerm } from "@/lib/ai";

export type DrawResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const cache = new Map<string, string>();

function keyOf(term: string, analogy: string): string {
  return `${term.toLowerCase()}::${analogy.slice(0, 80)}`;
}

export async function drawTerm(
  term: string,
  analogy: string,
  explanation: string,
  context = "",
): Promise<DrawResult> {
  const key = keyOf(term, analogy);
  const hit = cache.get(key);
  if (hit) return { ok: true, url: hit };
  const result = await illustrateTerm({
    data: { term, analogy, explanation, context },
  });
  if (result.ok) cache.set(key, result.url);
  return result;
}
