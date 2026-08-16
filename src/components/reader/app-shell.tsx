import { useEffect } from "react";
import { ArticlePane } from "@/components/reader/article-pane";
import { GlossaryPane } from "@/components/reader/glossary-pane";
import { FirstHint, ImportSheet, LibrarySheet } from "@/components/reader/overlays";
import { Toolbar } from "@/components/reader/toolbar";
import { cn } from "@/lib/cn";
import { explainSpan } from "@/lib/teach";
import { useCurrentArticle, useReader } from "@/store/reader";

export function AppShell() {
  const article = useCurrentArticle();
  const theme = useReader((s) => s.theme);
  const contrast = useReader((s) => s.contrast);
  const typeScale = useReader((s) => s.typeScale);
  const mobilePane = useReader((s) => s.mobilePane);
  const expanded = useReader((s) => s.expanded);
  const collapse = useReader((s) => s.collapse);
  const hydrate = useReader((s) => s.hydrate);
  const hydrated = useReader((s) => s.hydrated);
  const ask = useReader((s) => s.ask);
  const dismissAsk = useReader((s) => s.dismissAsk);
  const completeAsk = useReader((s) => s.completeAsk);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (ask) {
        e.preventDefault();
        dismissAsk();
        return;
      }
      if (expanded) {
        e.preventDefault();
        collapse();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, collapse, ask, dismissAsk]);

  useEffect(() => {
    if (!ask || ask.status !== "loading") return;
    const requestId = ask.requestId;
    let cancelled = false;
    void explainSpan({
      phrase: ask.text,
      kind: ask.kind,
      title: article.title,
      surrounding: ask.surrounding,
    }).then((result) => {
      if (cancelled) return;
      if (result.ok) completeAsk(requestId, result.term);
    });
    return () => {
      cancelled = true;
    };
  }, [ask?.requestId, ask?.status, article.title, completeAsk]);

  return (
    <div
      data-theme={theme}
      data-contrast={contrast}
      data-type={String(typeScale)}
      className="flex h-dvh max-w-full flex-col overflow-x-hidden bg-paper text-ink pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <Toolbar />
      <div className="relative min-h-0 flex-1">
        <div className="flex h-full min-h-0 min-w-0 lg:grid lg:grid-cols-[minmax(0,1.15fr)_1px_minmax(0,0.85fr)]">
          <div
            className={cn(
              "h-full min-h-0 min-w-0",
              mobilePane !== "read" && "hidden lg:block",
            )}
          >
            <ArticlePane article={article} />
          </div>
          <div className="hidden bg-rule lg:block" aria-hidden />
          <div
            className={cn(
              "h-full min-h-0 min-w-0",
              mobilePane !== "words" && "hidden lg:block",
            )}
          >
            <GlossaryPane article={article} />
          </div>
        </div>

        {hydrated ? <FirstHint /> : null}
      </div>
      <LibrarySheet />
      <ImportSheet />
    </div>
  );
}
