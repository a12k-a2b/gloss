export type OriginSkin = {
  html: string;
  css: string;
};

const DROP_TAG =
  /<(script|noscript|form|button|input|select|textarea|nav|footer|aside|object|embed|link|meta)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
const DROP_VOID =
  /<(script|link|meta|input|button)\b[^>]*\/?>/gi;

const CHROME_CLASS =
  /(?:^|[\s_-])(?:ad|ads|advert|promo|newsletter|subscribe|recirc|related|comment|social|share|cookie|paywall|popup|modal|sidebar|recommend|outbrain|taboola|jumbotron|site-header|site-footer|nav-bar|toolbar|breadcrumb)(?:$|[\s_-])/i;

const MEDIA_IFRAME =
  /(?:youtube\.com|youtu\.be|vimeo\.com|player\.vimeo|dailymotion\.com|player\.dailymotion)/i;

export function absolutize(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

export function collectStylesheetHrefs(html: string, pageUrl: string): string[] {
  const hrefs: string[] = [];
  const re = /<link\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const rel = tag.match(/\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const relVal = (rel?.[1] || rel?.[2] || rel?.[3] || "").toLowerCase();
    if (!relVal.includes("stylesheet")) continue;
    const href = tag.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const value = href?.[1] || href?.[2] || href?.[3];
    if (value && !value.startsWith("data:") && !/font-awesome|pagefind|cookieconsent|adsystem/i.test(value)) {
      hrefs.push(absolutize(value, pageUrl));
    }
  }
  return [...new Set(hrefs)].slice(0, 8);
}

export function collectInlineCss(html: string): string {
  const parts: string[] = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const css = m[1] ?? "";
    if (css.trim()) parts.push(css);
  }
  return parts.join("\n");
}

function pickArticleHtml(html: string): string {
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, " ");
  const candidates = [
    cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1],
    cleaned.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1],
    cleaned.match(
      /<(?:div|section)[^>]+(?:class|id)=["'][^"']*(?:post-content|entry-content|article-content|post-body|article-body|content-body|prose|entry-body)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/i,
    )?.[1],
  ].filter((c): c is string => !!c && c.length > 400);
  if (candidates.length === 0) {
    return cleaned.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? cleaned;
  }
  return candidates.sort((a, b) => b.length - a.length)[0] ?? cleaned;
}

function dropChromeBlocks(html: string): string {
  return html.replace(
    /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/gi,
    (full, tag: string, attrs: string, inner: string) => {
      const idClass = `${attrs} ${inner.slice(0, 120)}`;
      const hint = `${attrs}`;
      if (CHROME_CLASS.test(hint) && !/figure|img|video|picture|figcaption/i.test(tag)) {
        return " ";
      }
      if (/role=["'](?:navigation|banner|contentinfo|complementary)["']/i.test(attrs)) {
        return " ";
      }
      if (tag.toLowerCase() === "iframe") {
        const src = attrs.match(/src=["']([^"']+)["']/i)?.[1] ?? "";
        return MEDIA_IFRAME.test(src) ? full : " ";
      }
      void idClass;
      return full;
    },
  );
}

function rewriteUrls(html: string, pageUrl: string): string {
  return html.replace(
    /\s(href|src|poster)=["']([^"']+)["']/gi,
    (_, attr: string, value: string) => {
      if (value.startsWith("data:") || value.startsWith("#") || value.startsWith("mailto:")) {
        return ` ${attr}="${value}"`;
      }
      return ` ${attr}="${absolutize(value, pageUrl)}"`;
    },
  ).replace(
    /\ssrcset=["']([^"']+)["']/gi,
    (_, value: string) => {
      const next = value
        .split(",")
        .map((part) => {
          const [u, size] = part.trim().split(/\s+/, 2);
          if (!u) return part;
          return size ? `${absolutize(u, pageUrl)} ${size}` : absolutize(u, pageUrl);
        })
        .join(", ");
      return ` srcset="${next}"`;
    },
  );
}

const ALLOWED = new Set(
  `a abbr article audio b blockquote br caption cite code col colgroup dd del details dfn div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 hr i img ins kbd li main mark ol p picture pre q rp rt ruby s samp section small source span strong sub summary sup table tbody td tfoot th thead time tr u ul var video wbr iframe`.split(
    /\s+/,
  ),
);

const ALLOWED_ATTR = new Set(
  `href src srcset sizes alt title width height colspan rowspan cite datetime controls poster preload loop muted playsinline type media loading decoding target rel class id role colspan span start reversed open`.split(
    /\s+/,
  ),
);

function q(val: string) {
  return val.split('"').join("&#34;");
}

export function sanitizeOriginHtml(html: string, pageUrl: string): string {
  let next = html
    .replace(DROP_TAG, " ")
    .replace(DROP_VOID, " ")
    .replace(/ on\w+=["'][^"']*["']/gi, "")
    .replace(/ on\w+=\S+/gi, "");
  next = dropChromeBlocks(next);
  next = rewriteUrls(next, pageUrl);
  next = next.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    const closing = full.startsWith("</");
    if (!ALLOWED.has(name)) return " ";
    if (closing) return `</${name}>`;
    if (name === "iframe") {
      const src = attrs.match(/src=["']([^"']+)["']/i)?.[1] ?? "";
      if (!MEDIA_IFRAME.test(src)) return "";
    }
    const kept: string[] = [];
    const attrRe = /([a-z_:][a-z0-9:._-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/gi;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(attrs))) {
      const key = (m[1] ?? "").toLowerCase();
      const val = m[2] ?? m[3] ?? m[4] ?? "";
      if (key.startsWith("on")) continue;
      if (key === "style") {
        if (/expression|javascript:/i.test(val)) continue;
        kept.push(`style="${q(val)}"`);
        continue;
      }
      if (key.startsWith("aria-") || key.startsWith("data-")) {
        kept.push(`${key}="${q(val)}"`);
        continue;
      }
      if (!ALLOWED_ATTR.has(key)) continue;
      if ((key === "href" || key === "src") && /^\s*javascript:/i.test(val)) continue;
      if (key === "href") {
        kept.push(`href="${q(val)}"`, `target="_blank"`, `rel="noopener noreferrer"`);
        continue;
      }
      kept.push(`${key}="${q(val)}"`);
    }
    return `<${name}${kept.length ? " " + kept.join(" ") : ""}>`;
  });
  return next.replace(/\n{3,}/g, "\n\n").trim();
}

export function rewriteCssUrls(css: string, href: string): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (full, _q: string, value: string) => {
    if (value.startsWith("data:") || value.startsWith("#")) return full;
    return `url("${absolutize(value, href)}")`;
  });
}

export function extractOriginHtml(fullHtml: string, pageUrl: string): string {
  const raw = pickArticleHtml(fullHtml);
  return sanitizeOriginHtml(raw, pageUrl);
}

export function originLooksUseful(html: string): boolean {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const media = (html.match(/<(img|video|picture|iframe)\b/gi) ?? []).length;
  return text.length > 200 || media > 0;
}
