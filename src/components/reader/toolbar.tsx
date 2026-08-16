import type { ReactNode } from "react";
import { BookCopy, BookOpen, Contrast, Library, ListFilter, Minus, Moon, Newspaper, Plus, SunMedium, SunMoon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCurrentArticle, useReader } from "@/store/reader";

function IconBtn({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "flex size-11 items-center justify-center rounded-sm text-ink",
        "transition-transform duration-150 ease-out active:scale-[0.96]",
        pressed ? "bg-paper-sunken" : "hover:bg-paper-raised",
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar() {
  const article = useCurrentArticle();
  const typeScale = useReader((s) => s.typeScale);
  const theme = useReader((s) => s.theme);
  const themePref = useReader((s) => s.themePref);
  const cycleThemePref = useReader((s) => s.cycleThemePref);
  const contrast = useReader((s) => s.contrast);
  const setTypeScale = useReader((s) => s.setTypeScale);
  const setContrast = useReader((s) => s.setContrast);
  const setLibraryOpen = useReader((s) => s.setLibraryOpen);
  const setImportOpen = useReader((s) => s.setImportOpen);
  const formatSaved = useReader((s) => s.formatSaved);
  const setFormatSaved = useReader((s) => s.setFormatSaved);
  const marginFollow = useReader((s) => s.marginFollow);
  const setMarginFollow = useReader((s) => s.setMarginFollow);
  const paginate = useReader((s) => s.paginate);
  const setPaginate = useReader((s) => s.setPaginate);
  const hasOrigin = !!article.origin;

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b border-rule bg-paper px-2">
      <IconBtn label="Library" onClick={() => setLibraryOpen(true)}>
        <Library className="size-5" strokeWidth={1.6} />
      </IconBtn>
      <IconBtn label="Open a passage" onClick={() => setImportOpen(true)}>
        <BookOpen className="size-5" strokeWidth={1.6} />
      </IconBtn>

      <div className="mx-2 min-w-0 flex-1">
        <p className="truncate text-center font-serif text-sm text-ink-soft">
          {article.title}
        </p>
      </div>

      <div className="mx-1 h-5 w-px bg-rule" />

      {hasOrigin ? (
        <IconBtn
          label={formatSaved ? "Gloss page" : "As published"}
          pressed={formatSaved}
          onClick={() => setFormatSaved(!formatSaved)}
        >
          <Newspaper className="size-5" strokeWidth={1.6} />
        </IconBtn>
      ) : null}
      <IconBtn
        label={paginate ? "Scroll the page" : "Turn pages"}
        pressed={paginate}
        onClick={() => setPaginate(!paginate)}
      >
        <BookCopy className="size-5" strokeWidth={1.6} />
      </IconBtn>
      <IconBtn
        label={marginFollow ? "Show the whole glossary" : "Only words on this page"}
        pressed={marginFollow}
        onClick={() => setMarginFollow(!marginFollow)}
      >
        <ListFilter className="size-5" strokeWidth={1.6} />
      </IconBtn>

      <IconBtn
        label="Smaller type"
        onClick={() => setTypeScale(Math.max(0, typeScale - 1) as 0 | 1 | 2 | 3)}
      >
        <Minus className="size-4" strokeWidth={1.75} />
      </IconBtn>
      <IconBtn
        label="Larger type"
        onClick={() => setTypeScale(Math.min(3, typeScale + 1) as 0 | 1 | 2 | 3)}
      >
        <Plus className="size-4" strokeWidth={1.75} />
      </IconBtn>
      <IconBtn
        label={
          themePref === "system"
            ? "Following day and night. Tap to lock ink."
            : themePref === "ink"
              ? "Ink locked. Tap for paper."
              : "Paper locked. Tap to follow day and night."
        }
        pressed={themePref !== "system"}
        onClick={() => cycleThemePref()}
      >
        {themePref === "system" ? (
          <SunMoon className="size-5" strokeWidth={1.6} />
        ) : theme === "ink" ? (
          <Moon className="size-5" strokeWidth={1.6} />
        ) : (
          <SunMedium className="size-5" strokeWidth={1.6} />
        )}
      </IconBtn>
      <IconBtn
        label={contrast === "high" ? "Standard contrast" : "High contrast"}
        pressed={contrast === "high"}
        onClick={() => setContrast(contrast === "high" ? "standard" : "high")}
      >
        <Contrast className="size-5" strokeWidth={1.6} />
      </IconBtn>
    </header>
  );
}
