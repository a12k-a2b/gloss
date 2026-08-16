import { cn } from "@/lib/cn";
import { useSwipe } from "@/hooks/use-swipe";
import type { Term } from "@/lib/types";

export function TermCard({
  term,
  active,
  dimmed,
  onOpen,
  onFocus,
}: {
  term: Term;
  active: boolean;
  dimmed?: boolean;
  onOpen: () => void;
  onFocus: () => void;
}) {
  const swipe = useSwipe({
    onSwipeLeft: onOpen,
  });

  return (
    <article
      data-term-card={term.id}
      className={cn(
        "select-none touch-pan-y rounded-sm px-2.5 py-2 transition-[opacity,background-color] duration-300 ease-out",
        active && "bg-paper-sunken",
        dimmed && !active && "margin-dim",
      )}
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
        <p className="mt-0.5 line-clamp-2 font-serif text-[13px] leading-snug text-ink-faint text-pretty">
          {term.gloss}
        </p>
      </button>
    </article>
  );
}
