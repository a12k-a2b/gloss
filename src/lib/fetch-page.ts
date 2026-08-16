import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  extractArchivedPage,
  fetchArchivedCopy,
  isArchiveUrl,
  looksGated,
  looksLikeChallenge,
} from "@/lib/archive";
import { extractFromHtml, extractFromMarkdown, type ExtractedPage } from "@/lib/extract-page";
import { rewriteCssUrls } from "@/lib/origin-skin";

const input = z.object({
  url: z.string().min(8).max(2000),
});

function assertSafeUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new Error("That does not look like a link.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Use an http or https link.");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("That address is not a public page.");
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split(".").map(Number);
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 192 && b === 168) ||
      (a === 172 && (b ?? 0) >= 16 && (b ?? 0) <= 31)
    ) {
      throw new Error("That address is not a public page.");
    }
  }
  if (host.includes(":")) {
    throw new Error("That address is not a public page.");
  }
  return parsed;
}

async function readUrl(url: string, extraHeaders?: Record<string, string>): Promise<{
  finalUrl: string;
  body: string;
  type: string;
}> {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    signal: AbortSignal.timeout(14000),
    headers: {
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Gloss/1.0",
      ...extraHeaders,
    },
  });
  if (!res.ok) {
    throw new Error(`The page answered ${res.status}.`);
  }
  const type = res.headers.get("content-type") ?? "";
  const buf = await res.arrayBuffer();
  if (buf.byteLength > 2_000_000) {
    throw new Error("That page is too large to bring in.");
  }
  return {
    finalUrl: res.url || url,
    body: new TextDecoder("utf-8", { fatal: false }).decode(buf),
    type,
  };
}

async function attachOriginCss(page: ExtractedPage): Promise<ExtractedPage> {
  if (!page.origin) return page;
  const sheets = await Promise.all(
    (page.stylesheetHrefs ?? []).map(async (href) => {
      try {
        const file = await readUrl(href, { Accept: "text/css,*/*;q=0.1" });
        return rewriteCssUrls(file.body, href);
      } catch {
        return "";
      }
    }),
  );
  const css = [page.inlineCss ?? "", ...sheets]
    .filter(Boolean)
    .join("\n")
    .slice(0, 350_000);
  return { ...page, origin: { ...page.origin, css } };
}

function longerPage(a: ExtractedPage, b: ExtractedPage): ExtractedPage {
  return b.text.length > a.text.length ? b : a;
}

export const fetchArticleFromUrl = createServerFn({ method: "POST" })
  .validator((value: unknown) => input.parse(value))
  .handler(async ({ data }): Promise<
    { ok: true; page: ExtractedPage } | { ok: false; error: string }
  > => {
    try {
      const safe = assertSafeUrl(data.url);
      const first = await readUrl(safe.href);
      let page: ExtractedPage;
      if (first.type.includes("text/plain") || first.type.includes("markdown")) {
        page = extractFromMarkdown(first.body, first.finalUrl);
      } else {
        page = await attachOriginCss(extractFromHtml(first.body, first.finalUrl));
      }

      if (looksLikeChallenge(first.body)) {
        page = { ...page, text: "", blocks: [] };
      }

      if (!isArchiveUrl(safe.href) && looksGated(page, first.body)) {
        const snap = await fetchArchivedCopy(safe.href);
        if (snap) {
          const archived = await attachOriginCss(
            extractArchivedPage(snap.html, safe.href),
          );
          page = longerPage(page, archived);
        }
      }

      if (page.text.replace(/\s+/g, " ").trim().length < 280) {
        try {
          const via = await readUrl(`https://r.jina.ai/${safe.href}`, {
            Accept: "text/plain",
          });
          const fallback = extractFromMarkdown(via.body, safe.href);
          if (fallback.text.length > page.text.length) {
            page = {
              ...fallback,
              title: page.title !== "Untitled page" ? page.title : fallback.title,
              dek: page.dek || fallback.dek,
              source: page.source || fallback.source,
              origin: page.origin,
            };
          }
        } catch {
          /* keep first extract */
        }
      }

      if (page.text.replace(/\s+/g, " ").trim().length < 120) {
        return {
          ok: false,
          error:
            "I could not find the article on that page. Paste the text instead.",
        };
      }
      return { ok: true, page };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not open that page.";
      return { ok: false, error: message };
    }
  });
