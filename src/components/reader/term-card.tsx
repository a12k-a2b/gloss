import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSwipe } from "@/hooks/use-swipe";
import type { Term } from "@/lib/types";

export function TermCard({
  term,
  active,
  onOpen,
  onFocus,
}: {
  term: Term;
  active: boolean;
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
        "select-none touch-pan-y rounded-md px-3 py-3 transition-[background-color,box-shadow] duration-150",
        active
          ? "bg-paper-sunken hairline-strong"
          : "hairline bg-paper hover:bg-paper-raised",
      )}
      {...swipe}
    >
      <button
        type="button"
        onClick={onOpen}
        onFocus={onFocus}
        className="flex w-full items-start gap-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-sans text-md font-medium tracking-display text-ink">
            {term.term}
          </h3>
          <p className="mt-1 font-serif text-sm leading-snug text-ink-soft text-pretty">
            {term.gloss}
          </p>
        </div>
        <span
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center text-ink-faint"
          aria-hidden
        >
          <ChevronLeft className="size-4 rotate-180" strokeWidth={1.75} />
        </span>
      </button>
    </article>
  );
}
