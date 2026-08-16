import { useEffect, useState } from "react";
import { extractSharedUrl, ingestUrl } from "@/lib/ingest";
import { isOnline } from "@/lib/online";
import { prewarmBoards } from "@/lib/illustrate";
import { uploadShelf } from "@/lib/shelf";
import { useReader } from "@/store/reader";

type Toast = {
  title: string;
  articleId?: string;
  error?: string;
};

function takeSharedFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  const raw = q.get("url") || q.get("share") || q.get("text") || "";
  const href = extractSharedUrl(raw) ?? extractSharedUrl(q.get("title") ?? "");
  if (href) {
    const next = new URL(window.location.href);
    next.searchParams.delete("url");
    next.searchParams.delete("share");
    next.searchParams.delete("text");
    next.searchParams.delete("title");
    window.history.replaceState({}, "", next.pathname + next.search);
  }
  return href;
}

export function ShareInbox() {
  const addArticle = useReader((s) => s.addArticle);
  const openArticle = useReader((s) => s.openArticle);
  const hydrated = useReader((s) => s.hydrated);
  const [toast, setToast] = useState<Toast | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const run = async (href: string, open: boolean) => {
      setBusy(true);
      setToast({ title: "Bringing that page into Gloss…" });
      const result = await ingestUrl(href);
      if (cancelled) return;
      setBusy(false);
      if (!result.ok) {
        setToast({ title: "Could not bring that page in.", error: result.error });
        return;
      }
      addArticle(result.article);
      if (isOnline()) {
        void prewarmBoards(result.article.id, result.article.terms);
        const code = useReader.getState().shelfCode;
        if (code) void uploadShelf(code, useReader.getState().customArticles);
      }
      setToast({ title: result.article.title, articleId: result.article.id });
      if (open) openArticle(result.article.id);
    };

    const first = takeSharedFromLocation();
    if (first) void run(first, false);

    const onShare = (event: Event) => {
      const href = extractSharedUrl(String((event as CustomEvent).detail ?? ""));
      if (href) void run(href, false);
    };
    window.addEventListener("gloss-share", onShare as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener("gloss-share", onShare as EventListener);
    };
  }, [hydrated, addArticle, openArticle]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-md bg-ink px-3 py-2 text-paper shadow-lg">
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm font-medium truncate">
            {toast.articleId ? "In your library" : busy ? "Bringing it in" : "Gloss"}
          </p>
          <p className="truncate font-serif text-sm text-paper/80">
            {toast.error ?? toast.title}
          </p>
        </div>
        {toast.articleId ? (
          <button
            type="button"
            className="shrink-0 px-2 font-sans text-sm font-medium underline decoration-paper/40 underline-offset-4"
            onClick={() => {
              openArticle(toast.articleId!);
              setToast(null);
            }}
          >
            Read it
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Dismiss"
          className="shrink-0 px-1 font-sans text-sm text-paper/70"
          onClick={() => setToast(null)}
        >
          Close
        </button>
      </div>
    </div>
  );
}
