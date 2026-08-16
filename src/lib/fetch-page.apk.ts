import type { ExtractedPage } from "@/lib/extract-page";

export async function fetchArticleFromUrl(_input: {
  data: { url: string };
}): Promise<{ ok: true; page: ExtractedPage } | { ok: false; error: string }> {
  return {
    ok: false,
    error:
      "Opening a link needs the online app. Paste the article text instead, or use the two essays already in the library.",
  };
}
