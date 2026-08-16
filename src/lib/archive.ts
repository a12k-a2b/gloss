import { extractFromHtml, type ExtractedPage } from "@/lib/extract-page";

const ARCHIVE_HOSTS = [
  "archive.ph",
  "archive.is",
  "archive.fo",
  "archive.md",
  "archive.today",
];

const PAYWALL_HOST = [
  "nytimes.com",
  "wsj.com",
  "ft.com",
  "economist.com",
  "newyorker.com",
  "theatlantic.com",
  "wired.com",
  "washingtonpost.com",
  "bloomberg.com",
  "businessinsider.com",
  "latimes.com",
  "newyorkmag.com",
  "nymag.com",
  "vanityfair.com",
  "harpers.org",
  "lrb.co.uk",
  "nybooks.com",
  "foreignaffairs.com",
  "technologyreview.com",
  "thetimes.com",
  "telegraph.co.uk",
  "barrons.com",
  "seekingalpha.com",
];

const PAYWALL_COPY =
  /subscribe to (continue|read|unlock)|already a subscriber|create a free account to|this article is for subscribers|sign in to (read|continue)|remaining free article|you've reached your|you have reached your|metered_paywall|paywall|become a member to read/i;

export function isArchiveUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return ARCHIVE_HOSTS.includes(host) || host === "web.archive.org";
  } catch {
    return false;
  }
}

export function isPaywallHost(host: string): boolean {
  const h = host.replace(/^www\./, "").toLowerCase();
  return PAYWALL_HOST.some((p) => h === p || h.endsWith(`.${p}`));
}

export function looksGated(page: ExtractedPage, html = ""): boolean {
  const text = page.text.replace(/\s+/g, " ").trim();
  if (text.length >= 5000) return false;
  if (PAYWALL_COPY.test(html) || PAYWALL_COPY.test(text)) return true;
  if (isPaywallHost(page.host) && text.length < 2800) return true;
  return text.length < 280;
}

function stripArchiveChrome(html: string): string {
  return html
    .replace(/<div id="HEADER"[\s\S]*?<\/div>\s*<div id="CONTENT"/i, '<div id="CONTENT"')
    .replace(/<!-- BEGIN WAYBACK TOOLBAR INSERT -->[\s\S]*?<!-- END WAYBACK TOOLBAR INSERT -->/i, " ")
    .replace(/<div id="wm-ipp-base"[\s\S]*?<\/div>/i, " ");
}

async function readMaybe(
  url: string,
  timeoutMs: number,
): Promise<{ finalUrl: string; body: string } | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 800 || buf.byteLength > 2_500_000) return null;
    return {
      finalUrl: res.url || url,
      body: new TextDecoder("utf-8", { fatal: false }).decode(buf),
    };
  } catch {
    return null;
  }
}

function looksLikeSnapshot(html: string): boolean {
  if (/no results|not archived|no snapshots/i.test(html) && html.length < 8000) {
    return false;
  }
  return html.length > 4000;
}

export async function fetchArchivedCopy(
  originalUrl: string,
): Promise<{ html: string; snapshotUrl: string } | null> {
  for (const host of ARCHIVE_HOSTS) {
    const hit = await readMaybe(`https://${host}/newest/${originalUrl}`, 10000);
    if (hit && looksLikeSnapshot(hit.body)) {
      return { html: stripArchiveChrome(hit.body), snapshotUrl: hit.finalUrl };
    }
  }

  const wayback = await readMaybe(
    `https://web.archive.org/web/${originalUrl}`,
    12000,
  );
  if (wayback && looksLikeSnapshot(wayback.body)) {
    return { html: stripArchiveChrome(wayback.body), snapshotUrl: wayback.finalUrl };
  }
  return null;
}

export function extractArchivedPage(
  html: string,
  originalUrl: string,
): ExtractedPage {
  const page = extractFromHtml(html, originalUrl);
  const source = page.source.includes("archived")
    ? page.source
    : `${page.source} · archived`;
  return { ...page, source };
}
