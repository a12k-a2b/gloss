import { useEffect, useRef } from "react";
import { AskTeacherPane } from "@/components/reader/ask-dock";
import { TermCard } from "@/components/reader/term-card";
import { TermDetail } from "@/components/reader/term-detail";
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
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-paper-raised"
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
          <header className="shrink-0 border-b border-rule px-5 py-3">
            <p className="caps">In this passage</p>
            <p className="mt-1 font-sans text-sm text-ink-soft">
              Underlined words are already taught. Tap one. Any other word: tap
              twice. Tap again to take more of the sentence.
            </p>
          </header>
          <div ref={listRef} className="ink-scroll min-h-0 flex-1 px-3 py-3">
            {asked.length > 0 ? (
              <section className="mb-5">
                <p className="caps px-1 mb-2">You asked</p>
                <ul className="space-y-2">
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
            <ul className="space-y-2">
              {prepared.map((term) => (
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
            <div className="h-10" />
          </div>
        </>
      )}
    </aside>
  );
}
