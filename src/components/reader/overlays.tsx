import { useState } from "react";
import { LoaderCircle, Trash2, X } from "lucide-react";
import { SEED_ARTICLES } from "@/data/articles";
import { teachPassage } from "@/lib/teach";
import { flattenBlocks, parseImportedText } from "@/lib/parse-import";
import { cn } from "@/lib/cn";
import type { Article, Term } from "@/lib/types";
import { useCurrentArticle, useReader } from "@/store/reader";

function slugId(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "passage"
  );
}

function termId(term: string) {
  return slugId(term) || `term-${Math.random().toString(36).slice(2, 8)}`;
}

export function LibrarySheet() {
  const open = useReader((s) => s.libraryOpen);
  const setOpen = useReader((s) => s.setLibraryOpen);
  const setImportOpen = useReader((s) => s.setImportOpen);
  const openArticle = useReader((s) => s.openArticle);
  const removeArticle = useReader((s) => s.removeArticle);
  const custom = useReader((s) => s.customArticles);
  const current = useCurrentArticle();

  if (!open) return null;

  const all = [...custom, ...SEED_ARTICLES];

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close library"
        className="absolute inset-0 bg-ink/30"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 flex max-h-[88dvh] w-full max-w-xl flex-col rounded-t-lg bg-paper sm:rounded-lg hairline-strong">
        <header className="flex items-center justify-between border-b border-rule px-4 py-3">
          <div>
            <p className="caps">Library</p>
            <h2 className="font-serif text-xl font-medium">Passages</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="flex size-11 items-center justify-center"
          >
            <X className="size-5" strokeWidth={1.6} />
          </button>
        </header>
        <ul className="ink-scroll min-h-0 flex-1 divide-y divide-rule">
          {all.map((article) => (
            <li key={article.id} className="flex items-stretch">
              <button
                type="button"
                onClick={() => openArticle(article.id)}
                className={cn(
                  "flex-1 px-5 py-4 text-left",
                  current.id === article.id ? "bg-paper-sunken" : "bg-paper",
                )}
              >
                <p className="caps">
                  {article.custom ? "Brought in" : article.source}
                </p>
                <p className="mt-1 font-serif text-lg font-medium leading-snug">
                  {article.title}
                </p>
                <p className="mt-1 font-serif text-sm text-ink-soft">
                  {article.dek}
                </p>
              </button>
              {article.custom ? (
                <button
                  type="button"
                  aria-label={`Remove ${article.title}`}
                  onClick={() => removeArticle(article.id)}
                  className="flex w-12 items-center justify-center text-ink-faint"
                >
                  <Trash2 className="size-4" strokeWidth={1.6} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <footer className="border-t border-rule p-3">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setImportOpen(true);
            }}
            className="flex h-12 w-full items-center justify-center rounded-md bg-ink font-sans text-sm font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            Open a new passage
          </button>
          <a
            href="/gloss.apk"
            download="gloss.apk"
            className="mt-2 flex h-11 w-full items-center justify-center font-sans text-sm font-medium text-ink-soft underline decoration-1 underline-offset-2"
          >
            Install on a Daylight (Android APK)
          </a>
        </footer>
      </div>
    </div>
  );
}

export function ImportSheet() {
  const open = useReader((s) => s.importOpen);
  const setOpen = useReader((s) => s.setImportOpen);
  const addArticle = useReader((s) => s.addArticle);

  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const onFile = async (file: File) => {
    const text = await file.text();
    setRaw(text);
  };

  const onTeach = async () => {
    if (raw.trim().length < 40) {
      setError("Paste a little more — a paragraph or two is enough.");
      return;
    }
    setBusy(true);
    setError(null);
    const parsed = parseImportedText(raw);
    const flat = flattenBlocks(parsed.blocks);
    try {
      const result = await teachPassage(parsed.title, flat.slice(0, 16000));
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        return;
      }
      const terms: Term[] = result.analysis.terms.map((t) => ({
        id: termId(t.term),
        term: t.term,
        aliases: t.aliases ?? [],
        gloss: t.gloss,
        explanation: t.explanation,
        analogy: t.analogy,
        context: t.context,
        excerpt: t.excerpt,
        related: t.related ?? [],
        diagram: t.diagram,
      }));
      const article: Article = {
        id: `custom-${Date.now()}`,
        title: result.analysis.title || parsed.title,
        dek: result.analysis.dek,
        source: "Brought in",
        minutes: Math.max(1, Math.round(flat.split(/\s+/).length / 220)),
        custom: true,
        blocks: parsed.blocks,
        terms,
      };
      addArticle(article);
      setRaw("");
    } catch {
      setError("Could not reach the teacher. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/30"
        onClick={() => !busy && setOpen(false)}
      />
      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-lg bg-paper sm:rounded-lg hairline-strong">
        <header className="flex items-center justify-between border-b border-rule px-4 py-3">
          <div>
            <p className="caps">Bring a passage</p>
            <h2 className="font-serif text-xl font-medium">HTML or plain text</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={() => setOpen(false)}
            className="flex size-11 items-center justify-center"
          >
            <X className="size-5" strokeWidth={1.6} />
          </button>
        </header>
        <div className="ink-scroll min-h-0 flex-1 space-y-3 px-4 py-4">
          <p className="font-serif text-md leading-reading text-ink-soft">
            Paste the article. Gloss will underline the jargon and write a
            teacher's note for each word — the same margin you have on the
            seeded essays.
          </p>
          <label className="hairline flex h-11 cursor-pointer items-center justify-center rounded-md bg-paper-raised font-sans text-sm font-medium">
            Choose a .txt or .html file
            <input
              type="file"
              accept=".txt,.html,.md,text/plain,text/html"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
          </label>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Paste here…"
            rows={10}
            className="w-full resize-y rounded-md border border-rule bg-paper px-3 py-3 font-serif text-md leading-reading text-ink outline-none focus-visible:border-ink"
          />
          {error ? (
            <p className="font-sans text-sm text-ink">{error}</p>
          ) : null}
        </div>
        <footer className="border-t border-rule p-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onTeach()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink font-sans text-sm font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" strokeWidth={1.75} />
            ) : null}
            {busy ? "Reading the passage…" : "Teach me the jargon"}
          </button>
        </footer>
      </div>
    </div>
  );
}

export function FirstHint() {
  const seen = useReader((s) => s.hintSeen);
  const dismiss = useReader((s) => s.dismissHint);
  const hydrated = useReader((s) => s.hydrated);
  if (!hydrated || seen) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-16 z-20 flex justify-center px-4 lg:bottom-8 lg:left-auto lg:right-6 lg:w-[min(22rem,38vw)]">
      <div className="pointer-events-auto hairline-strong w-full rounded-md bg-paper px-4 py-3">
        <p className="font-serif text-md leading-snug text-ink">
          Underlined words live in the right margin. Tap one — or swipe it left —
          to go deeper.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 font-sans text-sm font-medium underline decoration-1 underline-offset-2"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
