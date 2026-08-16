import { useState, type ReactNode } from "react";
import { ArrowLeft, Image as ImageIcon, LoaderCircle } from "lucide-react";
import { InkDiagram } from "@/components/reader/ink-diagram";
import { cn } from "@/lib/cn";
import { drawTerm } from "@/lib/illustrate";
import { useSwipe } from "@/hooks/use-swipe";
import type { Term } from "@/lib/types";

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
}: {
  term: Term;
  related: Term[];
  onBack: () => void;
  onOpenRelated: (id: string) => void;
}) {
  const swipe = useSwipe({ onSwipeRight: onBack });
  const [drawing, setDrawing] = useState(false);
  const [drawn, setDrawn] = useState<string | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);

  const handleDraw = async () => {
    if (drawing) return;
    setDrawing(true);
    setDrawError(null);
    try {
      const result = await drawTerm(term.term, term.analogy, term.explanation);
      if (result.ok) setDrawn(result.url);
      else setDrawError(result.error);
    } catch {
      setDrawError("Could not reach the illustrator.");
    } finally {
      setDrawing(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col" {...swipe}>
      <header className="flex shrink-0 items-center gap-2 border-b border-rule px-2 py-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 items-center gap-2 px-2 font-sans text-sm font-medium text-ink transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Words
        </button>
      </header>

      <div className="ink-scroll min-h-0 flex-1 px-5 py-5">
        <p className="caps">In this passage</p>
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

        <section className="mb-6">
          <p className="caps mb-2">Drawn</p>
          {drawn ? (
            <img
              src={drawn}
              alt={`Ink figure of ${term.term}`}
              className="w-full rounded-md outline outline-1 -outline-offset-1 outline-ink/20"
              crossOrigin="anonymous"
            />
          ) : (
            <button
              type="button"
              onClick={handleDraw}
              disabled={drawing}
              className="hairline flex h-11 w-full items-center justify-center gap-2 rounded-md bg-paper-raised font-sans text-sm font-medium text-ink transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-60"
            >
              {drawing ? (
                <LoaderCircle className="size-4 animate-spin" strokeWidth={1.75} />
              ) : (
                <ImageIcon className="size-4" strokeWidth={1.75} />
              )}
              {drawing ? "Drawing a figure…" : "Draw this as a figure"}
            </button>
          )}
          {drawError ? (
            <p className="mt-2 font-sans text-sm text-ink-soft">{drawError}</p>
          ) : null}
        </section>

        {related.length > 0 ? (
          <section className="mb-10">
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
      </div>
    </div>
  );
}
