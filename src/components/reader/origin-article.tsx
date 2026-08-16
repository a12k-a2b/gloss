import { useEffect, useRef } from "react";
import { collectNeedles } from "@/lib/wrap-terms";
import { tokenize, type AskToken } from "@/lib/ask-select";
import type { Article, Term } from "@/lib/types";

const MARK_CSS = `
:host {
  display: block;
  font-family: Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, serif;
  color: #1a1814;
  line-height: 1.55;
}
.origin-root { max-width: 100%; width: 100%; overflow-wrap: anywhere; overflow-x: hidden; }
.origin-root img, .origin-root video, .origin-root iframe, .origin-root picture {
  max-width: 100%;
  height: auto;
}
.origin-root iframe { width: 100%; aspect-ratio: 16/9; border: 0; }
.ask-token { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.term-mark {
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 0.18em;
  text-decoration-color: currentColor;
}
.term-echo { text-decoration: none; }
.term-mark[data-active="true"] {
  background: #1a1814;
  color: #f3efe4;
  text-decoration: none;
  box-shadow: 0 0 0 2px #1a1814;
}
.ask-mark {
  background: #ddd6c4;
  box-shadow: 0 0 0 3px #ddd6c4;
  text-decoration: none;
}
.ask-pulse {
  background: #ddd6c4;
  box-shadow: 0 0 0 2px #ddd6c4;
}
`;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">");
}

function wrapText(
  text: string,
  terms: Term[],
  claimed: Set<string>,
  tokens: AskToken[],
  blockKey: string,
): string {
  if (!text) return "";
  const catalog = terms
    .flatMap((term) => collectNeedles(term).map((needle) => ({ needle, term })))
    .sort((a, b) => b.needle.length - a.needle.length);
  const pattern =
    catalog.length > 0
      ? catalog
          .map(({ needle }) => {
            const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return /^[A-Za-z0-9]/.test(needle) && /[A-Za-z0-9]$/.test(needle)
              ? `\\b${escaped}\\b`
              : escaped;
          })
          .join("|")
      : null;
  const re = pattern ? new RegExp(pattern, "gi") : null;
  const pieces: { raw: string; term?: Term; first?: boolean }[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  if (re) {
    while ((match = re.exec(text)) !== null) {
      if (match.index > last) pieces.push({ raw: text.slice(last, match.index) });
      const found = catalog.find((c) => c.needle.toLowerCase() === match![0].toLowerCase());
      if (found) {
        const first = !claimed.has(found.term.id);
        if (first) claimed.add(found.term.id);
        pieces.push({ raw: match[0], term: found.term, first });
      } else {
        pieces.push({ raw: match[0] });
      }
      last = match.index + match[0].length;
    }
  }
  if (last < text.length) pieces.push({ raw: text.slice(last) });

  let html = "";
  for (const piece of pieces) {
    if (piece.term) {
      const index = tokens.length;
      tokens.push({
        index,
        text: piece.raw,
        isWord: true,
        start: 0,
        end: piece.raw.length,
      });
      const cls = piece.first ? "ask-token term-mark" : "ask-token term-echo";
      html += `<span class="${cls}" data-token="${blockKey}:${index}" data-term="${piece.term.id}" data-first="${piece.first ? "true" : "false"}">${escapeHtml(piece.raw)}</span>`;
      continue;
    }
    const slice = tokenize(piece.raw);
    for (const tok of slice) {
      if (!tok.isWord) {
        html += escapeHtml(tok.text);
        continue;
      }
      const index = tokens.length;
      tokens.push({
        index,
        text: tok.text,
        isWord: true,
        start: tok.start,
        end: tok.end,
      });
      html += `<span class="ask-token" data-token="${blockKey}:${index}">${escapeHtml(tok.text)}</span>`;
    }
  }
  return html;
}

function markOriginHtml(
  html: string,
  terms: Term[],
): { html: string; text: string; tokens: AskToken[] } {
  if (typeof DOMParser === "undefined") {
    return { html, text: html.replace(/<[^>]+>/g, " "), tokens: [] };
  }
  const doc = new DOMParser().parseFromString(`<div id="o">${html}</div>`, "text/html");
  const root = doc.getElementById("o");
  if (!root) return { html, text: "", tokens: [] };
  const claimed = new Set<string>();
  const tokens: AskToken[] = [];
  const skip = new Set(["SCRIPT", "STYLE", "PRE", "CODE", "TEXTAREA"]);
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      const parent = node.parentElement;
      if (parent && skip.has(parent.tagName)) return;
      const value = node.nodeValue ?? "";
      if (!value.trim()) return;
      const wrapped = wrapText(value, terms, claimed, tokens, "origin:0");
      const hold = doc.createElement("span");
      hold.innerHTML = wrapped;
      const frag = doc.createDocumentFragment();
      while (hold.firstChild) frag.appendChild(hold.firstChild);
      parent?.replaceChild(frag, node);
      return;
    }
    if (node.nodeType === 1 && skip.has((node as Element).tagName)) return;
    const kids = Array.from(node.childNodes);
    for (const kid of kids) walk(kid);
  };
  walk(root);
  return {
    html: root.innerHTML,
    text: root.textContent ?? "",
    tokens,
  };
}

export function OriginArticle({
  article,
  activeId,
  ask,
  pulseToken,
  onReady,
}: {
  article: Article;
  activeId: string | null;
  ask: { tokenStart: number; tokenEnd: number } | null;
  pulseToken: string | null;
  onReady: (payload: { text: string; tokens: AskToken[]; root: ShadowRoot | null }) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !article.origin) return;
    if (!shadowRef.current) {
      shadowRef.current = host.attachShadow({ mode: "open" });
    }
    const marked = markOriginHtml(article.origin.html, article.terms);
    const css = `${article.origin.css}\n${MARK_CSS}`;
    shadowRef.current.innerHTML = `<style>${css}</style><div class="origin-root">${marked.html}</div>`;
    onReady({ text: marked.text, tokens: marked.tokens, root: shadowRef.current });
  }, [article.id, article.origin?.html, article.origin?.css, article.terms, onReady]);

  useEffect(() => {
    const root = shadowRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("[data-term]").forEach((el) => {
      el.dataset.active = el.dataset.term === activeId && !ask ? "true" : "false";
    });
    root.querySelectorAll<HTMLElement>("[data-token]").forEach((el) => {
      const raw = el.dataset.token ?? "";
      const index = Number(raw.split(":").pop());
      const asked = !!ask && index >= ask.tokenStart && index <= ask.tokenEnd;
      el.classList.toggle("ask-mark", asked);
      el.classList.toggle("ask-pulse", pulseToken === raw);
    });
  }, [activeId, ask, pulseToken]);

  if (!article.origin) return null;
  return <div ref={hostRef} className="origin-host" />;
}
