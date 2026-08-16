import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";
import { markArticle, type MarkedBlock, type TextPart } from "@/lib/wrap-terms";
import type { Article } from "@/lib/types";
import { useReader } from "@/store/reader";

function Parts({
  parts,
  activeId,
  onSelect,
}: {
  parts: TextPart[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {parts.map((part, i) =>
        part.type === "text" ? (
          <span key={i}>{part.value}</span>
        ) : (
          <button
            key={`${part.term.id}-${i}`}
            type="button"
            className="term-mark"
            data-term={part.term.id}
            data-active={part.term.id === activeId ? "true" : "false"}
            onClick={() => onSelect(part.term.id)}
          >
            {part.value}
          </button>
        ),
      )}
    </>
  );
}

function BlockView({
  block,
  activeId,
  onSelect,
}: {
  block: MarkedBlock;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul";
    return (
      <List
        className={cn(
          "my-4 space-y-2 pl-5 text-ink",
          block.ordered ? "list-decimal" : "list-disc",
        )}
      >
        {block.items.map((item, i) => (
          <li key={i}>
            <Parts parts={item} activeId={activeId} onSelect={onSelect} />
          </li>
        ))}
      </List>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="my-5 overflow-x-auto rounded-sm bg-paper-sunken px-4 py-3 font-mono text-sm leading-snug text-ink">
        <code>{block.text}</code>
      </pre>
    );
  }

  if (block.type === "table") {
    return (
      <div className="my-5 overflow-x-auto">
        <table className="w-full min-w-96 border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-ink">
              {block.headers.map((h, i) => (
                <th key={i} className="px-2 py-2 font-medium align-top">
                  <Parts parts={h} activeId={activeId} onSelect={onSelect} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-rule">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-2 align-top text-ink-soft">
                    <Parts parts={cell} activeId={activeId} onSelect={onSelect} />
                  </td>
                ))}
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
    return (
      <aside className="my-5 rounded-sm bg-paper-sunken px-4 py-3">
        <p className="caps mb-1">{label}</p>
        <p className="font-serif text-md leading-reading text-ink">
          <Parts parts={block.parts} activeId={activeId} onSelect={onSelect} />
        </p>
      </aside>
    );
  }

  const inner = (
    <Parts parts={block.parts} activeId={activeId} onSelect={onSelect} />
  );
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

export function ArticlePane({ article }: { article: Article }) {
  const scroller = useRef<HTMLElement>(null);
  const focusedTermId = useReader((s) => s.focusedTermId);
  const focusTerm = useReader((s) => s.focusTerm);
  const marked = useMemo(() => markArticle(article), [article]);

  useEffect(() => {
    if (!focusedTermId || !scroller.current) return;
    const el = scroller.current.querySelector<HTMLElement>(
      `button.term-mark[data-term="${focusedTermId}"]`,
    );
    if (!el) return;
    const parent = scroller.current;
    const er = el.getBoundingClientRect();
    const pr = parent.getBoundingClientRect();
    if (er.top < pr.top + 80 || er.bottom > pr.bottom - 40) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [focusedTermId]);

  return (
    <section
      ref={scroller}
      className="ink-scroll h-full min-h-0 min-w-0"
      aria-label="Passage"
    >
      <article className="article-body mx-auto max-w-prose px-5 py-7 sm:px-8 sm:py-9">
        <p className="caps mb-3">
          {article.source}
          <span className="mx-2 text-rule-strong">·</span>
          {article.minutes} min
        </p>
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
            activeId={focusedTermId}
            onSelect={focusTerm}
          />
        ))}
        <div className="h-16" />
      </article>
    </section>
  );
}
