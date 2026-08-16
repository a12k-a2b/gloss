import { parseImportedText } from "@/lib/parse-import";
import {
  collectInlineCss,
  collectStylesheetHrefs,
  extractOriginHtml,
  originLooksUseful,
  type OriginSkin,
} from "@/lib/origin-skin";
import type { Block } from "@/lib/types";

export type ExtractedPage = {
  title: string;
  dek: string;
  source: string;
  host: string;
  url: string;
  text: string;
  blocks: Block[];
  origin?: OriginSkin;
  stylesheetHrefs?: string[];
  inlineCss?: string;
};

const JUNK =
  /<(script|style|noscript|svg|iframe|canvas|form|nav|footer|aside|button)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCharCode(parseInt(n, 16)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, names: string[]): string {
  for (const name of names) {
    const patterns = [
      new RegExp(
        `<meta\\b[^>]*(?:property|name|itemprop)=["']${name}["'][^>]*>`,
        "i",
      ),
      new RegExp(
        `<meta\\b[^>]*content=(["'])[\\s\\S]*?\\1[^>]*(?:property|name|itemprop)=["']${name}["'][^>]*>`,
        "i",
      ),
    ];
    for (const re of patterns) {
      const tag = html.match(re)?.[0];
      if (!tag) continue;
      const quoted = tag.match(/content=(["'])([\s\S]*?)\1/i);
      if (quoted?.[2]) return decode(quoted[2]);
    }
  }
  return "";
}

function tagText(html: string, tag: string): string {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return "";
  return decode(m[1].replace(/<[^>]+>/g, " "));
}

function firstMatch(html: string, re: RegExp): string {
  const m = html.match(re);
  return m?.[1] ?? "";
}

function pickMain(html: string): string {
  const cleaned = html
    .replace(JUNK, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const candidates = [
    firstMatch(cleaned, /<article\b[^>]*>([\s\S]*?)<\/article>/i),
    firstMatch(cleaned, /<main\b[^>]*>([\s\S]*?)<\/main>/i),
    firstMatch(
      cleaned,
      /<(?:div|section)[^>]+(?:class|id)=["'][^"']*(?:post-content|entry-content|article-content|post-body|article-body|content-body|prose)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i,
    ),
  ].filter((c) => c.length > 400);
  if (candidates.length === 0) {
    return firstMatch(cleaned, /<body\b[^>]*>([\s\S]*?)<\/body>/i) || cleaned;
  }
  return candidates.sort((a, b) => b.length - a.length)[0] ?? cleaned;
}

export function extractFromHtml(html: string, url: string): ExtractedPage {
  const parsedUrl = new URL(url);
  const host = parsedUrl.hostname.replace(/^www\./, "");
  const title =
    meta(html, ["og:title", "twitter:title"]) ||
    tagText(html, "title") ||
    "Untitled page";
  const dek =
    meta(html, ["og:description", "twitter:description", "description"]) ||
    "";
  const author = meta(html, ["author", "article:author"]);
  const main = pickMain(html);
  const parsed = parseImportedText(main);
  const text = parsed.blocks
    .map((b) => {
      if (b.type === "list") return b.items.join(" ");
      if (b.type === "table") return [...b.headers, ...b.rows.flat()].join(" ");
      return "text" in b ? b.text : "";
    })
    .join("\n")
    .trim();
  const source = author ? `${author} · ${host}` : host;
  const originHtml = extractOriginHtml(html, url);
  const origin = originLooksUseful(originHtml)
    ? { html: originHtml.slice(0, 400_000), css: "" }
    : undefined;
  return {
    title: title.slice(0, 180),
    dek: dek.slice(0, 280),
    source,
    host,
    url,
    text,
    blocks: parsed.blocks.length > 0 ? parsed.blocks : [{ type: "p", text }],
    origin,
    stylesheetHrefs: collectStylesheetHrefs(html, url),
    inlineCss: collectInlineCss(html).slice(0, 200_000),
  };
}

export function extractFromMarkdown(md: string, url: string): ExtractedPage {
  const parsedUrl = new URL(url);
  const host = parsedUrl.hostname.replace(/^www\./, "");
  const parsed = parseImportedText(md);
  const text = parsed.blocks
    .map((b) => ("text" in b ? b.text : b.type === "list" ? b.items.join(" ") : ""))
    .join("\n")
    .trim();
  return {
    title: parsed.title,
    dek: "",
    source: host,
    host,
    url,
    text,
    blocks: parsed.blocks,
  };
}
