import { parseHTML } from "linkedom";

/**
 * Pick the real article node. Inspired by Mozilla Readability and
 * Obsidian's Defuddle: score candidates, do not trust the longest
 * <article> or <main> (comments and recirc often win that contest).
 */

const HOST_HINTS: Record<string, string[]> = {
  "quantamagazine.org": [".post__content", ".post__content__section"],
  "spectrum.ieee.org": [".body-description", "article.page-article"],
  "ieee.org": [".body-description", "article.page-article"],
  "lesswrong.com": [
    ".PostsPage-postContent",
    ".ContentStyles-postBody",
    ".PostsPage-postHeader",
  ],
  "nautil.us": [".article-content", ".entry-content", ".single-content"],
  "aeon.co": [".article__body", ".cms-body", "[itemprop=articleBody]"],
  "theguardian.com": [
    "[data-gu-name=body]",
    ".article-body-commercial-selector",
    "#maincontent",
  ],
  "bbc.com": ["article", "[data-component='text-block']"],
  "theverge.com": [".duet--article--article-body-component", ".c-entry-content"],
  "arstechnica.com": [".article-content", "article.post"],
  "wired.com": [".body__inner-container", ".article__body"],
  "newyorker.com": [".body__inner-container", ".article__body"],
  "theatlantic.com": [".article-body", ".l-article__content", "article"],
  "slatestarcodex.com": [".pjgm-postcontent", ".entry-content"],
  "astralcodexten.com": [".body.markup", ".available-content"],
  "paulgraham.com": ["body"],
  "blog.denv.it": [".post-content", "article"],
  "nature.com": [".c-article-body", "article"],
  "technologyreview.com": [".content-wrapper", "article"],
};

const POSITIVE =
  /article|postcontent|post-content|post__content|entry-content|article-body|article__body|story-body|body-description|available-content|wysiwyg|post-body|entry-body|articlebody|article-content|single-content|cms-body|prose/i;

const NEGATIVE =
  /comment|recirc|related|sidebar|share|newsletter|promo|modal|popup|footer|header|nav-|navbar|subscribe|recommend|social|outbrain|taboola|breadcrumb|author-bio|next-post|prev-post|paywall|cookie|consent|metering/i;

function hostKey(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function scoreNode(el: Element): number {
  const idc = `${el.id} ${el.getAttribute("class") ?? ""}`.toLowerCase();
  let s = 0;
  if (NEGATIVE.test(idc)) s -= 90;
  if (POSITIVE.test(idc)) s += 45;
  if (/article/i.test(el.tagName)) s += 12;
  if (/main/i.test(el.tagName)) s += 6;

  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  s += Math.min(words / 12, 60);
  s += Math.min((el.querySelectorAll("p") ?? []).length * 6, 72);
  s += (text.match(/[,:;]/g) ?? []).length * 0.4;
  s += el.querySelectorAll("figure, img, video, picture").length * 4;
  s += el.querySelectorAll("h1, h2, h3").length * 2;

  const linkText = [...el.querySelectorAll("a")].reduce(
    (n, a) => n + ((a.textContent ?? "").length),
    0,
  );
  if (text.length > 200 && linkText / text.length > 0.42) s -= 50;

  if (
    el.closest(
      "#comments, .comments, .article__comments, .article-content__comments-wrapper",
    )
  ) {
    s -= 120;
  }
  if (words < 40) s -= 25;
  return s;
}

function stripJunk(root: Element) {
  const killSel = [
    "nav",
    "footer",
    "aside",
    "form",
    "script",
    "style",
    "noscript",
    "iframe:not([src*='youtu']):not([src*='vimeo'])",
    "[id*='comment' i]",
    "[class*='comments' i]",
    "[class*='recirc' i]",
    "[class*='related-' i]",
    "[class*='newsletter' i]",
    "[class*='subscribe' i]",
    "[class*='social' i]",
    "[class*='share' i]",
    "[class*='outbrain' i]",
    "[class*='taboola' i]",
    "[class*='tooltip' i]",
    "[class*='top-menu' i]",
    "[class*='nav__local' i]",
    "[data-name='show-comments']",
    "[data-name='comment-bubble']",
    ".comments-button",
    ".share-buttons",
    ".save-article",
    ".related-list",
    ".post__aside",
    ".q-tooltip",
  ].join(", ");

  for (const n of [...root.querySelectorAll(killSel)]) {
    if (n === root) continue;
    const hint = `${n.id} ${n.getAttribute("class") ?? ""}`;
    if (
      n.querySelector("p") &&
      (n.textContent ?? "").length > 2400 &&
      !/comment|recirc|related|newsletter|subscribe|share|social|aside|top-menu/i.test(hint)
    ) {
      continue;
    }
    n.remove();
  }

  for (const n of [...root.querySelectorAll("button, a, div, span, section, ul, ol, h2, h3")]) {
    if (n === root) continue;
    if (looksLikeChrome(n)) n.remove();
  }
}

const CHROME_LABEL =
  /^(save( article)?|read later|share|facebook|twitter|linkedin|reddit|pocket|ycombinator|copy(ed| link)?!?|email|topics|home|log in|sign in|subscribe|follow|listen)$/i;

function looksLikeChrome(el: Element): boolean {
  const hint = `${el.id} ${el.getAttribute("class") ?? ""}`.toLowerCase();
  if (/nav__local|top-menu|share|social|tooltip|save-article|read-later|post__aside|related-list/.test(hint)) {
    return true;
  }
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!text) {
    return !!el.querySelector("svg") && !el.querySelector("img, video, p");
  }
  if (CHROME_LABEL.test(text)) return true;
  if (text.length < 80 && /save article|read later|copy link|copied!?/.test(text.toLowerCase())) {
    return true;
  }
  const links = el.querySelectorAll("a");
  if (links.length >= 5 && text.length < 220 && !el.querySelector("p")) return true;
  if (el.querySelector("svg") && text.length < 48 && !el.querySelector("p, figure, img")) return true;
  return false;
}

function wordCount(el: Element): number {
  return (el.textContent ?? "").split(/\s+/).filter(Boolean).length;
}

function preferInner(best: Element, hinted: Element[]): Element {
  let pick = best;
  for (const inner of hinted) {
    if (pick !== inner && pick.contains(inner)) {
      const innerWords = wordCount(inner);
      const parentWords = wordCount(pick);
      if (innerWords > 160 && parentWords > 0 && innerWords / parentWords > 0.7) {
        pick = inner;
      }
    }
  }
  return pick;
}

export function pickArticleHtml(html: string, pageUrl: string): string {
  const { document } = parseHTML(String(html));
  const host = hostKey(pageUrl);

  const hinted: Element[] = [];
  for (const sel of HOST_HINTS[host] ?? []) {
    try {
      hinted.push(...document.querySelectorAll(sel));
    } catch {
      /* bad selector */
    }
  }

  const generic = document.querySelectorAll(
    "article, main, [itemprop='articleBody'], [role='main'], .post-content, .post__content, .entry-content, .article-body, .article__body, .article-content, .story-body, .body-description, .available-content, .prose",
  );

  const seen = new Set<Element>();
  const candidates: Element[] = [];
  for (const el of [...hinted, ...generic]) {
    if (seen.has(el)) continue;
    seen.add(el);
    candidates.push(el);
  }

  if (candidates.length === 0) {
    const body = document.querySelector("body");
    return body?.innerHTML ?? html;
  }

  let best = candidates[0]!;
  let bestScore = -Infinity;
  for (const el of candidates) {
    const hintedBoost = hinted.includes(el) ? 40 : 0;
    const sc = scoreNode(el) + hintedBoost;
    if (sc > bestScore) {
      bestScore = sc;
      best = el;
    }
  }
  best = preferInner(best, hinted);

  const clone = best.cloneNode(true) as Element;
  stripJunk(clone);
  if (!clone.querySelector("h1")) {
    const hed = document.querySelector("h1");
    if (hed) clone.insertBefore(hed.cloneNode(true), clone.firstChild);
  }
  const out = clone.innerHTML || (clone as { innerHTML?: string }).innerHTML || "";
  return out.length > 80 ? out : (document.querySelector("body")?.innerHTML ?? html);
}

export function articleTextFromHtml(html: string): string {
  const { document } = parseHTML(`<div id="r">${html}</div>`);
  return (document.getElementById("r")?.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();
}
