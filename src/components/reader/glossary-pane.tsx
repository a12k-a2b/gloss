import { useEffect, useRef } from "react";
import { AskTeacherPane } from "@/components/reader/ask-dock";
import { TermCard } from "@/components/reader/term-card";
import { TermDetail } from "@/components/reader/term-detail";
import { fieldKicker } from "@/lib/fields";
import type { Article, Term } from "@/lib/types";
import { useReader } from "@/store/reader";

const EMPTY_TERMS: Term[] = [];

function relatedTerms(term: Term, all: Term[]): Term[] {
  const byId = new Map(all.map((t) => [t.id, t]));
  const byName = new Map(all.map((t) => [t.term.toLowerCase(), t]));
  const out: Term[] = [];
  for (const key of term.related) {
    const found = byId.get(key) ?? byName.get(key.toLowerCase());
    if (found && found.id !== term.id && !out.some((t) => t.id === found.id)) {
      out.push(found);
    }
  }
  return out;
}

export function GlossaryPane({ article }: { article: Article }) {
  const listRef = useRef<HTMLDivElement>(null);
  const expanded = useReader((s) => s.expanded);
  const activeTermId = useReader((s) => s.activeTermId);
  const focusedTermId = useReader((s) => s.focusedTermId);
  const expandTerm = useReader((s) => s.expandTerm);
  const focusTerm = useReader((s) => s.focusTerm);
  const collapse = useReader((s) => s.collapse);
  const ask = useReader((s) => s.ask);
  const extraMap = useReader((s) => s.extraTerms);
  const extra = extraMap[article.id] ?? EMPTY_TERMS;
  const visibleIds = useReader((s) => s.visibleTermIds);
  const visible = new Set(visibleIds);

  const asked = extra.filter((t) => t.source === "asked");
  const prepared = article.terms.filter((t) => t.source !== "asked");

  const active =
    article.terms.find((t) => t.id === activeTermId) ?? prepared[0] ?? null;

  const showingAsk = !!ask;
  const showingDetail = !showingAsk && expanded;

  useEffect(() => {
    if (expanded || ask || !focusedTermId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-term-card="${focusedTermId}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedTermId, expanded, ask]);

  return (
    <aside
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-paper"
      aria-label="Margin"
    >
      {showingAsk ? (
        <AskTeacherPane />
      ) : showingDetail && active ? (
        <TermDetail
          term={active}
          related={relatedTerms(active, article.terms)}
          onBack={collapse}
          onOpenRelated={(id) => expandTerm(id)}
        />
      ) : (
        <>
          <header className="gloss-margin-head shrink-0">
            <p className="caps text-ink-faint">{fieldKicker(article.field)}</p>
          </header>
          <div ref={listRef} className="gloss-margin-list ink-scroll min-h-0 flex-1">
            {asked.length > 0 ? (
              <section className="mb-4">
                <p className="caps px-1 mb-1 text-ink-faint">You asked</p>
                <ul className="space-y-0.5">
                  {asked.map((term) => (
                    <li key={term.id}>
                      <TermCard
                        term={term}
                        active={focusedTermId === term.id}
                        onOpen={() => expandTerm(term.id)}
                        onFocus={() => focusTerm(term.id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <ul className="space-y-0.5">
              {prepared.map((term) => (
                <li key={term.id}>
                  <TermCard
                    term={term}
                    active={focusedTermId === term.id}
                    dimmed={visible.size > 0 && !visible.has(term.id)}
                    onOpen={() => expandTerm(term.id)}
                    onFocus={() => focusTerm(term.id)}
                  />
                </li>
              ))}
            </ul>
            <div className="h-10" />
          </div>
        </>
      )}
    </aside>
  );
}
