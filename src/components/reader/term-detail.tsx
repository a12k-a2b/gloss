import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { BoardFigure } from "@/components/reader/board-figure";
import { InkDiagram } from "@/components/reader/ink-diagram";
import { cn } from "@/lib/cn";
import { useSwipe } from "@/hooks/use-swipe";
import type { Term } from "@/lib/types";
import { useReader } from "@/store/reader";

function Section({
  kicker,
  children,
}: {
  kicker: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-5">
      <p className="caps mb-2">{kicker}</p>
      <div className="font-serif text-md leading-reading text-ink text-pretty">
        {children}
      </div>
    </section>
  );
}

export function TermDetail({
  term,
  related,
  onBack,
  onOpenRelated,
  kicker = "In this passage",
  backLabel = "Words",
}: {
  term: Term;
  related: Term[];
  onBack: () => void;
  onOpenRelated: (id: string) => void;
  kicker?: string;
  backLabel?: string;
}) {
  const swipe = useSwipe({ onSwipeLeft: onBack, onSwipeRight: onBack });
  const knowTerm = useReader((s) => s.knowTerm);

  return (
    <div
      className="flex h-full min-h-0 flex-col touch-pan-y"
      data-tour="lesson"
      {...swipe}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-rule px-2 py-2">
        <button
          type="button"
          onClick={onBack}
          data-tour="back"
          className="flex h-11 items-center gap-2 px-2 font-sans text-sm font-medium text-ink transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          {backLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            knowTerm(term);
            onBack();
          }}
          className="ml-auto h-11 px-3 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft"
        >
          I know this
        </button>
      </header>

      <div className="ink-scroll min-h-0 flex-1 px-5 py-5">
        <p className="caps">{kicker}</p>
        <h2 className="mt-1 font-serif text-2xl font-medium leading-tight tracking-display text-ink text-balance">
          {term.term}
        </h2>

        {term.excerpt ? (
          <blockquote className="mt-4 border-l-2 border-ink pl-3 font-serif text-sm leading-snug text-ink-soft italic">
            {term.excerpt}
          </blockquote>
        ) : null}

        <div className="mt-5">
          <Section kicker="In short">{term.gloss}</Section>
          <Section kicker="Think of it like">{term.analogy}</Section>
        </div>

        <Section kicker="On the page">
          <InkDiagram spec={term.diagram} />
        </Section>

        <Section kicker="What's going on">{term.explanation}</Section>
        <Section kicker="Why it's here">{term.context}</Section>

        {related.length > 0 ? (
          <section className="mb-6">
            <p className="caps mb-2">See also</p>
            <ul className="flex flex-wrap gap-2">
              {related.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onOpenRelated(r.id)}
                    className={cn(
                      "hairline h-10 rounded-md px-3 font-sans text-sm font-medium text-ink",
                      "bg-paper transition-transform duration-150 ease-out active:scale-[0.96]",
                    )}
                  >
                    {r.term}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <BoardFigure term={term} />
      </div>
    </div>
  );
}
