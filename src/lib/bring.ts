import { fetchArticleFromUrl } from "@/lib/fetch-page";
import type { ExtractedPage } from "@/lib/extract-page";

export type BringResult =
  | { ok: true; page: ExtractedPage }
  | { ok: false; error: string };

export async function bringPage(url: string): Promise<BringResult> {
  return fetchArticleFromUrl({ data: { url } });
}
