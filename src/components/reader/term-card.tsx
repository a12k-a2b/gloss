import { cn } from "@/lib/cn";
import { useSwipe } from "@/hooks/use-swipe";
import { termTldr } from "@/lib/tldr";
import type { Term } from "@/lib/types";

export function TermCard({
  term,
  active,
  dimmed,
  onOpen,
  onFocus,
  onKnow,
}: {
  term: Term;
  active: boolean;
  dimmed?: boolean;
  onOpen: () => void;
  onFocus: () => void;
  onKnow: () => void;
}) {
  const swipe = useSwipe({
    onSwipeLeft: onOpen,
    onSwipeRight: onOpen,
  });

  return (
    <article
      data-term-card={term.id}
      className={cn(
        "select-none touch-pan-y rounded-sm px-2.5 py-2.5 transition-[opacity,background-color] duration-300 ease-out",
        active && "bg-paper-sunken",
        dimmed && !active && "margin-dim",
      )}
      onClick={onOpen}
      {...swipe}
    >
      <button
        type="button"
        onClick={onOpen}
        onFocus={onFocus}
        className="block w-full text-left"
      >
        <h3
          className={cn(
            "font-sans text-sm font-medium tracking-display",
            active ? "text-ink" : "text-ink-soft",
          )}
        >
          {term.term}
        </h3>
        <p className="mt-1.5 font-serif text-[15px] leading-snug text-ink-soft text-pretty">
          {termTldr(term)}
        </p>
      </button>
      <button
        type="button"
        className="mt-2 font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint"
        onClick={(e) => {
          e.stopPropagation();
          onKnow();
        }}
      >
        I know this
      </button>
    </article>
  );
}