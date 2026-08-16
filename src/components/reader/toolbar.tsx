import type { ReactNode } from "react";
import { BookOpen, Contrast, Library, Minus, Newspaper, Plus, SunMedium } from "lucide-react";
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
  const contrast = useReader((s) => s.contrast);
  const setTypeScale = useReader((s) => s.setTypeScale);
  const setTheme = useReader((s) => s.setTheme);
  const setContrast = useReader((s) => s.setContrast);
  const setLibraryOpen = useReader((s) => s.setLibraryOpen);
  const setImportOpen = useReader((s) => s.setImportOpen);
  const formatSaved = useReader((s) => s.formatSaved);
  const setFormatSaved = useReader((s) => s.setFormatSaved);
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
        label={theme === "paper" ? "Ink night page" : "Paper day page"}
        pressed={theme === "ink"}
        onClick={() => setTheme(theme === "paper" ? "ink" : "paper")}
      >
        <SunMedium className="size-5" strokeWidth={1.6} />
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
