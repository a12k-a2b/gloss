import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OriginArticle } from "@/components/reader/origin-article";
import { cn } from "@/lib/cn";
import { tokensFromParts, tokenize, padContains, type AskToken } from "@/lib/ask-select";
import { markArticle, type MarkedBlock, type TextPart } from "@/lib/wrap-terms";
import type { Article } from "@/lib/types";
import { usePageBreaks } from "@/hooks/use-page-breaks";
import { collectVisibleTermIds } from "@/lib/visible-terms";
import { useReader } from "@/store/reader";

type TokenMeta = {
  blockKey: string;
  tokenIndex: number;
  fullText: string;
  tokens: AskToken[];
  termId?: string;
};

const surfaces = new Map<string, { text: string; tokens: AskToken[] }>();

function rememberSurface(
  blockKey: string,
  parts: TextPart[] | null,
  raw?: string,
) {
  if (parts) {
    surfaces.set(blockKey, tokensFromParts(parts));
  } else {
    const text = raw ?? "";
    surfaces.set(blockKey, { text, tokens: tokenize(text) });
  }
}

function tokenId(blockKey: string, index: number) {
  return `${blockKey}:${index}`;
}

function Parts({
  parts,
  blockKey,
  fullText,
  tokens,
  tokenOffset,
  activeId,
  askActive,
  askStart,
  askEnd,
  pulseToken,
}: {
  parts: TextPart[];
  blockKey: string;
  fullText: string;
  tokens: AskToken[];
  tokenOffset: number;
  activeId: string | null;
  askActive: boolean;
  askStart: number;
  askEnd: number;
  pulseToken: string | null;
}) {
  let cursor = tokenOffset;
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === "term") {
          const index = cursor;
          cursor += 1;
          const id = tokenId(blockKey, index);
          const asked = askActive && index >= askStart && index <= askEnd;
          return (
            <span
              key={`${blockKey}-t-${i}`}
              data-token={id}
              data-term={part.term.id}
              data-first={part.first ? "true" : "false"}
              data-active={part.term.id === activeId && !askActive ? "true" : "false"}
              className={cn(
                "ask-token",
                part.first ? "term-mark" : "term-echo",
                asked && "ask-mark",
                pulseToken === id && "ask-pulse",
              )}
            >
              {part.value}
            </span>
          );
        }
        const slice = tokenize(part.value);
        const start = cursor;
        cursor += slice.length;
        return (
          <span key={`${blockKey}-s-${i}`}>
            {slice.map((tok, k) => {
              const index = start + k;
              if (!tok.isWord) return <span key={k}>{tok.text}</span>;
              const id = tokenId(blockKey, index);
              const asked = askActive && index >= askStart && index <= askEnd;
              return (
                <span
                  key={k}
                  data-token={id}
                  className={cn(
                    "ask-token",
                    asked && "ask-mark",
                    pulseToken === id && "ask-pulse",
                  )}
                >
                  {tok.text}
                </span>
              );
            })}
          </span>
        );
      })}
    </>
  );
}

function surfaceText(block: MarkedBlock, item?: number, cell?: [number, number]): string {
  if (block.type === "code") return block.text;
  if (block.type === "list" && item != null) {
    return block.items[item].map((p) => p.value).join("");
  }
  if (block.type === "table") {
    if (item === -1 && cell) {
      return block.headers[cell[1]].map((p) => p.value).join("");
    }
    if (item != null && cell) {
      return block.rows[item][cell[1]].map((p) => p.value).join("");
    }
  }
  if ("parts" in block) return block.parts.map((p) => p.value).join("");
  return "";
}

function BlockView({
  block,
  blockIndex,
  activeId,
  ask,
  pulseToken,
}: {
  block: MarkedBlock;
  blockIndex: number;
  activeId: string | null;
  ask: { blockKey: string; tokenStart: number; tokenEnd: number } | null;
  pulseToken: string | null;
}) {
  const renderParts = (
    parts: TextPart[],
    key: string,
    text: string,
  ) => {
    rememberSurface(key, parts);
    const asked = ask && ask.blockKey === key;
    return (
      <Parts
        parts={parts}
        blockKey={key}
        fullText={text}
        tokens={tokenize(text)}
        tokenOffset={0}
        activeId={activeId}
        askActive={!!asked}
        askStart={asked ? ask.tokenStart : -1}
        askEnd={asked ? ask.tokenEnd : -1}
        pulseToken={pulseToken}
      />
    );
  };

  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul";
    return (
      <List
        className={cn(
          "my-4 space-y-2 pl-5 text-ink",
          block.ordered ? "list-decimal" : "list-disc",
        )}
      >
        {block.items.map((item, i) => {
          const key = `${blockIndex}:li:${i}`;
          return (
            <li key={i}>
              {renderParts(item, key, surfaceText(block, i))}
            </li>
          );
        })}
      </List>
    );
  }

  if (block.type === "code") {
    const key = `${blockIndex}:code`;
    rememberSurface(key, null, block.text);
    const tokens = tokenize(block.text);
    const asked = ask && ask.blockKey === key;
    return (
      <pre className="my-5 overflow-x-auto rounded-sm bg-paper-sunken px-4 py-3 font-mono text-sm leading-snug text-ink">
        <code>
          {tokens.map((tok, i) =>
            tok.isWord ? (
              <span
                key={i}
                data-token={tokenId(key, i)}
                className={cn(
                  "ask-token",
                  asked && i >= ask.tokenStart && i <= ask.tokenEnd && "ask-mark",
                )}
              >
                {tok.text}
              </span>
            ) : (
              <span key={i}>{tok.text}</span>
            ),
          )}
        </code>
      </pre>
    );
  }

  if (block.type === "table") {
    return (
      <div className="my-5 overflow-x-auto">
        <table className="w-full min-w-96 border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-ink">
              {block.headers.map((h, i) => {
                const key = `${blockIndex}:th:${i}`;
                return (
                  <th key={i} className="px-2 py-2 font-medium align-top">
                    {renderParts(h, key, h.map((p) => p.value).join(""))}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-rule">
                {row.map((cell, ci) => {
                  const key = `${blockIndex}:td:${ri}:${ci}`;
                  return (
                    <td key={ci} className="px-2 py-2 align-top text-ink-soft">
                      {renderParts(cell, key, cell.map((p) => p.value).join(""))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "note") {
    const label =
      block.kind === "tip" ? "Tip" : block.kind === "warning" ? "Warning" : "Note";
    const key = `${blockIndex}:note`;
    return (
      <aside className="my-5 rounded-sm bg-paper-sunken px-4 py-3">
        <p className="caps mb-1">{label}</p>
        <p className="font-serif text-md leading-reading text-ink">
          {renderParts(block.parts, key, block.parts.map((p) => p.value).join(""))}
        </p>
      </aside>
    );
  }

  const key = `${blockIndex}`;
  const text = block.parts.map((p) => p.value).join("");
  const inner = renderParts(block.parts, key, text);
  if (block.type === "h1") {
    return (
      <h1 className="mb-3 font-serif text-3xl font-medium leading-tight tracking-display text-ink">
        {inner}
      </h1>
    );
  }
  if (block.type === "h2") {
    return (
      <h2 className="mt-8 mb-3 font-serif text-xl font-medium leading-snug tracking-display text-ink">
        {inner}
      </h2>
    );
  }
  if (block.type === "h3") {
    return (
      <h3 className="mt-6 mb-2 font-serif text-lg font-medium leading-snug text-ink">
        {inner}
      </h3>
    );
  }
  if (block.type === "quote") {
    return (
      <blockquote className="my-5 border-l-2 border-ink pl-4 text-ink-soft italic">
        {inner}
      </blockquote>
    );
  }
  return <p className="mb-4 text-ink">{inner}</p>;
}

function readToken(el: HTMLElement): TokenMeta | null {
  const raw = el.dataset.token;
  if (!raw) return null;
  const cut = raw.lastIndexOf(":");
  if (cut < 0) return null;
  const blockKey = raw.slice(0, cut);
  const tokenIndex = Number(raw.slice(cut + 1));
  if (!Number.isFinite(tokenIndex)) return null;
  const surface = surfaces.get(blockKey);
  if (!surface) return null;
  return {
    blockKey,
    tokenIndex,
    fullText: surface.text,
    tokens: surface.tokens,
    termId: el.dataset.term,
  };
}

export function ArticlePane({ article }: { article: Article }) {
  const scroller = useRef<HTMLElement>(null);
  const session = useRef<{
    key: string;
    count: number;
    at: number;
    x: number;
    y: number;
  } | null>(null);
  const pointer = useRef<{ x: number; y: number; id: number } | null>(null);
  const pulseTimer = useRef<number | null>(null);

  const focusedTermId = useReader((s) => s.focusedTermId);
  const expandTerm = useReader((s) => s.expandTerm);
  const applyAskTap = useReader((s) => s.applyAskTap);
  const dismissAsk = useReader((s) => s.dismissAsk);
  const setPulseToken = useReader((s) => s.setPulseToken);
  const ask = useReader((s) => s.ask);
  const pulseToken = useReader((s) => s.pulseToken);
  const formatSaved = useReader((s) => s.formatSaved);
  const paginate = useReader((s) => s.paginate);
  const setVisibleTerms = useReader((s) => s.setVisibleTerms);
  const [skinTick, setSkinTick] = useState(0);
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState<null | { dir: "next" | "prev"; html: string; from: number }>(
    null,
  );
  const flipping = useRef(false);
  const measure = useRef<HTMLElement>(null);
  const marked = useMemo(() => markArticle(article), [article]);
  const useOrigin = !!(formatSaved && article.origin);
  const breaks = usePageBreaks(scroller, measure, paginate, [
    article.id,
    useOrigin,
    skinTick,
  ]);

  useEffect(() => {
    setPage(0);
    setFlip(null);
    flipping.current = false;
  }, [article.id, paginate]);

  useEffect(() => {
    if (page > breaks.length - 1) setPage(Math.max(0, breaks.length - 1));
  }, [breaks.length, page]);

  const onOriginReady = useCallback(
    (payload: { text: string; tokens: AskToken[]; root: ShadowRoot | null }) => {
      surfaces.set("origin:0", { text: payload.text, tokens: payload.tokens });
      setSkinTick((n) => n + 1);
    },
    [],
  );

  useEffect(() => {
    const host = scroller.current;
    if (!focusedTermId || !host || ask) return;
    if (paginate) return;
    const shadow = host.querySelector(".origin-host")?.shadowRoot;
    const el =
      shadow?.querySelector<HTMLElement>(
        `[data-term="${focusedTermId}"][data-first="true"]`,
      ) ??
      host.querySelector<HTMLElement>(
        `[data-term="${focusedTermId}"][data-first="true"]`,
      );
    if (!el) return;
    const er = el.getBoundingClientRect();
    const pr = host.getBoundingClientRect();
    if (er.top < pr.top + 80 || er.bottom > pr.bottom - 40) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [focusedTermId, ask]);

  useEffect(() => {
    const host = scroller.current;
    if (!host || paginate) return;
    let timer: number | null = null;
    let last: string[] = [];
    const publish = () => {
      const ids = collectVisibleTermIds(host);
      if (ids.length === 0 && last.length > 0) return;
      const same =
        ids.length === last.length && ids.every((id, i) => id === last[i]);
      if (same) return;
      last = ids;
      setVisibleTerms(ids);
    };
    const onMove = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(publish, 120);
    };
    publish();
    host.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove);
    const ro = new ResizeObserver(onMove);
    ro.observe(host);
    return () => {
      if (timer) window.clearTimeout(timer);
      host.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
      ro.disconnect();
    };
  }, [article.id, formatSaved, skinTick, setVisibleTerms, paginate]);

  const publishPageTerms = useCallback(() => {
    const host = scroller.current;
    if (!host) return;
    const ids = collectVisibleTermIds(host);
    setVisibleTerms(ids);
  }, [setVisibleTerms]);

  useEffect(() => {
    if (!paginate) return;
    const t = window.setTimeout(publishPageTerms, 40);
    return () => window.clearTimeout(t);
  }, [paginate, page, article.id, skinTick, publishPageTerms]);

  const goPage = useCallback(
    (next: number, dir: "next" | "prev") => {
      if (!paginate || flipping.current) return;
      const last = breaks.length - 1;
      const target = Math.max(0, Math.min(last, next));
      if (target === page) return;
      const html = measure.current?.innerHTML ?? "";
      flipping.current = true;
      setFlip({ dir, html, from: breaks[page] ?? 0 });
      setPage(target);
      window.setTimeout(() => {
        setFlip(null);
        flipping.current = false;
      }, 620);
    },
    [paginate, breaks, page],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointer.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;

    if (paginate && Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      if (dx < 0) goPage(page + 1, "next");
      else goPage(page - 1, "prev");
      return;
    }

    if (Math.hypot(dx, dy) > 14) return;

    if (paginate && !ask) {
      const host = scroller.current;
      if (host) {
        const box = host.getBoundingClientRect();
        const path = e.nativeEvent.composedPath();
        const onToken = path.some(
          (n) => n instanceof HTMLElement && !!n.dataset.token,
        );
        if (!onToken) {
          const x = e.clientX - box.left;
          if (x < box.width * 0.18) {
            goPage(page - 1, "prev");
            return;
          }
          if (x > box.width * 0.82) {
            goPage(page + 1, "next");
            return;
          }
        }
      }
    }

    const path = e.nativeEvent.composedPath();
    let target: HTMLElement | null = null;
    for (const node of path) {
      if (node instanceof HTMLElement && node.dataset.token) {
        target = node;
        break;
      }
    }
    const host = scroller.current;
    const shadow = host?.querySelector(".origin-host")?.shadowRoot;
    const markNodes = [
      ...(host?.querySelectorAll<HTMLElement>(".ask-mark") ?? []),
      ...(shadow?.querySelectorAll<HTMLElement>(".ask-mark") ?? []),
    ];
    const marks = markNodes.map((n) => n.getBoundingClientRect());
    const inPad = ask ? padContains(marks, e.clientX, e.clientY, 56) : false;

    if (ask && inPad) {
      const surface = surfaces.get(ask.blockKey);
      applyAskTap({
        blockKey: ask.blockKey,
        tokenIndex: ask.originIndex,
        tapCount: Math.min(ask.tapCount + 1, 5),
        fullText: surface?.text ?? ask.surrounding,
        tokens: surface?.tokens,
        surrounding: surface?.text ?? ask.surrounding,
      });
      return;
    }

    if (ask && !inPad) {
      session.current = null;
      dismissAsk();
      if (!target) return;
    }

    if (!target) return;

    const meta = readToken(target);
    if (!meta) return;

    const now = Date.now();
    const same =
      session.current &&
      session.current.key === target.dataset.token &&
      now - session.current.at < 1100;
    const count = same && session.current ? session.current.count + 1 : 1;
    session.current = {
      key: target.dataset.token ?? meta.blockKey,
      count,
      at: now,
      x: e.clientX,
      y: e.clientY,
    };

    if (count === 1) {
      if (meta.termId && !ask) {
        expandTerm(meta.termId);
        return;
      }
      setPulseToken(target.dataset.token ?? null);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
      pulseTimer.current = window.setTimeout(() => {
        setPulseToken(null);
        if (session.current && session.current.count === 1) session.current = null;
      }, 700);
      return;
    }

    applyAskTap({
      blockKey: meta.blockKey,
      tokenIndex: meta.tokenIndex,
      tapCount: Math.min(count, 5),
      fullText: meta.fullText,
      tokens: meta.tokens,
      surrounding: meta.fullText,
    });
  };

  return (
    <section
      ref={scroller}
      className={cn(
        "relative h-full min-h-0 min-w-0",
        paginate ? "page-stage" : "ink-scroll",
      )}
      aria-label="Passage"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pointer.current = null;
      }}
    >
      {flip ? (
        <div
          className={cn("page-leaf", flip.dir === "next" ? "flip-next" : "flip-prev")}
          aria-hidden
        >
          <div
            className="article-measure mx-auto"
            style={{ transform: `translateY(-${flip.from}px)` }}
            dangerouslySetInnerHTML={{ __html: flip.html }}
          />
        </div>
      ) : null}
      <article
        ref={measure}
        className={cn("article-measure mx-auto", !useOrigin && "article-body")}
        style={
          paginate
            ? { transform: `translateY(-${breaks[page] ?? 0}px)` }
            : undefined
        }
      >
        <p className="caps mb-3 px-1">
          {useOrigin ? "As published" : article.source}
          <span className="mx-2 text-rule-strong">·</span>
          {useOrigin ? article.source : `${article.minutes} min`}
        </p>
        {useOrigin ? (
          <OriginArticle
            article={article}
            activeId={focusedTermId}
            ask={
              ask
                ? { tokenStart: ask.tokenStart, tokenEnd: ask.tokenEnd }
                : null
            }
            pulseToken={pulseToken}
            onReady={onOriginReady}
          />
        ) : (
          <>
            <h1 className="mb-3 font-serif text-3xl font-medium leading-tight tracking-display text-balance">
              {article.title}
            </h1>
            <p className="mb-8 font-serif text-lg leading-snug text-ink-soft italic text-pretty">
              {article.dek}
            </p>
            {marked.map((block, i) => (
              <BlockView
                key={i}
                block={block}
                blockIndex={i}
                activeId={focusedTermId}
                ask={
                  ask
                    ? {
                        blockKey: ask.blockKey,
                        tokenStart: ask.tokenStart,
                        tokenEnd: ask.tokenEnd,
                      }
                    : null
                }
                pulseToken={pulseToken}
              />
            ))}
          </>
        )}
        <div className="h-16" />
      </article>
      {paginate && breaks.length > 1 ? (
        <p className="page-folio" data-page-chrome="true">
          {page + 1} / {breaks.length}
        </p>
      ) : null}
    </section>
  );
}
