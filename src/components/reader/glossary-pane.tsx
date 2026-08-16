import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { TermCard } from "@/components/reader/term-card";
import { TermDetail } from "@/components/reader/term-detail";
import type { Article, Term } from "@/lib/types";
import { useReader } from "@/store/reader";

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

  const active =
    article.terms.find((t) => t.id === activeTermId) ?? article.terms[0] ?? null;

  useEffect(() => {
    if (expanded || !focusedTermId || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-term-card="${focusedTermId}"]`,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedTermId, expanded]);

  return (
    <aside className="relative flex h-full min-h-0 flex-col overflow-hidden bg-paper-raised" aria-label="Margin">
      <div
        className={cn(
          "absolute inset-0 flex flex-col transition-transform duration-fast ease-out",
          expanded ? "pointer-events-none -translate-x-full" : "translate-x-0",
        )}
      >
        <header className="shrink-0 border-b border-rule px-5 py-3">
          <p className="caps">In this passage</p>
          <p className="mt-1 font-sans text-sm text-ink-soft">
            {article.terms.length} words worth stopping for. Tap one, or swipe it
            left.
          </p>
        </header>
        <div ref={listRef} className="ink-scroll min-h-0 flex-1 px-3 py-3">
          <ul className="space-y-2">
            {article.terms.map((term) => (
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
      </div>

      <div
        className={cn(
          "absolute inset-0 bg-paper-raised transition-transform duration-fast ease-out",
          expanded ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
        aria-hidden={!expanded}
      >
        {active ? (
          <TermDetail
            term={active}
            related={relatedTerms(active, article.terms)}
            onBack={collapse}
            onOpenRelated={(id) => expandTerm(id)}
          />
        ) : null}
      </div>
    </aside>
  );
}
