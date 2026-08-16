import { analyzePassage } from "@/lib/ai";
import type { AnalysisResult } from "@/lib/ai";

export type TeachResult =
  | { ok: true; analysis: AnalysisResult }
  | { ok: false; error: string };

export async function teachPassage(
  title: string,
  text: string,
): Promise<TeachResult> {
  return analyzePassage({ data: { title, text } });
}
