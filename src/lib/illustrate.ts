import { illustrateTerm } from "@/lib/ai";

export type DrawResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function drawTerm(
  term: string,
  analogy: string,
  explanation: string,
): Promise<DrawResult> {
  return illustrateTerm({ data: { term, analogy, explanation } });
}
