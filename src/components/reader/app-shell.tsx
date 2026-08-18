import { useEffect } from "react";
import { ArticlePane } from "@/components/reader/article-pane";
import { GlossaryPane } from "@/components/reader/glossary-pane";
import { NativeMenuShield } from "@/components/reader/native-shield";
import { ImportSheet, LibrarySheet } from "@/components/reader/overlays";
import { Onboarding, currentTourGate } from "@/components/reader/onboarding";
import { ShareInbox } from "@/components/reader/share-inbox";
import { Toolbar } from "@/components/reader/toolbar";
import { useSystemTheme } from "@/hooks/use-system-theme";
import { explainSpan } from "@/lib/teach";
import { useCurrentArticle, useReader } from "@/store/reader";

export function AppShell() {
  const article = useCurrentArticle();
  const theme = useReader((s) => s.theme);
  const contrast = useReader((s) => s.contrast);
  const typeScale = useReader((s) => s.typeScale);
  const expanded = useReader((s) => s.expanded);
  const collapse = useReader((s) => s.collapse);
  const hydrate = useReader((s) => s.hydrate);
  const hydrated = useReader((s) => s.hydrated);
  const ask = useReader((s) => s.ask);
  const dismissAsk = useReader((s) => s.dismissAsk);
  const completeAsk = useReader((s) => s.completeAsk);
  const onboarded = useReader((s) => s.onboarded);
  const tourStep = useReader((s) => s.tourStep);
  const gate = currentTourGate(onboarded, tourStep);
  const glossaryLeft = useReader((s) => s.glossaryLeft);
  useSystemTheme();

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
      data-tour-gate={gate ?? undefined}
      className="flex h-dvh max-w-full flex-col overflow-hidden bg-paper text-ink pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      onContextMenu={(e) => {
        const t = e.target;
        const el = t instanceof Element ? t : t instanceof Node ? t.parentElement : null;
        if (el?.closest("input, textarea, [data-allow-select]")) {
          return;
        }
        e.preventDefault();
      }}
    >
      <NativeMenuShield />
      <Toolbar />
      <div className="relative min-h-0 flex-1">
        <div className={glossaryLeft ? "gloss-split is-glossary-left" : "gloss-split"}>
          <div className="gloss-pane-read h-full min-h-0 min-w-0">
            <ArticlePane article={article} />
          </div>
          <div className="gloss-pane-rule bg-rule" aria-hidden />
          <div className="gloss-pane-words h-full min-h-0 min-w-0">
            <GlossaryPane article={article} />
          </div>
        </div>

        {hydrated ? <Onboarding /> : null}
      </div>
      <LibrarySheet />
      <ImportSheet />
      <ShareInbox />
    </div>
  );
}
