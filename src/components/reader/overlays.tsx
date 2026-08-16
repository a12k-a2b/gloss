import { useState, type ReactNode } from "react";
import { Trash2, X } from "lucide-react";
import { BeaverWait } from "@/components/reader/beaver-wait";
import { SEED_ARTICLES } from "@/data/articles";
import { ingestUrl } from "@/lib/ingest";
import { isOnline } from "@/lib/online";
import { prewarmBoards } from "@/lib/illustrate";
import {
  downloadShelf,
  mintShelfCode,
  packLibrary,
  unpackLibrary,
  uploadShelf,
} from "@/lib/shelf";
import { flattenBlocks, parseImportedText } from "@/lib/parse-import";
import {
  formatLogForChat,
  loadImportLog,
  recordImport,
  seconds,
  summarizeLog,
} from "@/lib/import-log";
import { teachPassage } from "@/lib/teach";
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

function hostOf(url?: string) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function addedLabel(ts?: number) {
  if (!ts) return null;
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function looksLikeUrl(raw: string): string | null {
  const t = raw.trim();
  if (/^https?:\/\/\S+$/i.test(t)) return t;
  if (/^(www\.)?[\w.-]+\.[a-z]{2,}([/:?#]\S*)?$/i.test(t) && !/\s/.test(t)) {
    return `https://${t.replace(/^\/\//, "")}`;
  }
  return null;
}

export function LibrarySheet() {
  const open = useReader((s) => s.libraryOpen);
  const setOpen = useReader((s) => s.setLibraryOpen);
  const setImportOpen = useReader((s) => s.setImportOpen);
  const openArticle = useReader((s) => s.openArticle);
  const removeArticle = useReader((s) => s.removeArticle);
  const custom = useReader((s) => s.customArticles);
  const current = useCurrentArticle();
  const shelfCode = useReader((s) => s.shelfCode);
  const setShelfCode = useReader((s) => s.setShelfCode);
  const mergeArticles = useReader((s) => s.mergeArticles);
  const [join, setJoin] = useState("");
  const [shelfNote, setShelfNote] = useState<string | null>(null);

  if (!open) return null;

  const onExport = () => {
    const blob = new Blob([packLibrary(custom)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "gloss-shelf.json";
    a.click();
    URL.revokeObjectURL(href);
  };

  const onImportFile = async (file: File) => {
    try {
      const articles = unpackLibrary(await file.text());
      mergeArticles(articles);
      setShelfNote(`Brought in ${articles.length} pieces.`);
    } catch {
      setShelfNote("That file was not a Gloss shelf.");
    }
  };

  const onMakeShelf = async () => {
    const code = shelfCode || mintShelfCode();
    setShelfCode(code);
    const res = await uploadShelf(code, custom);
    setShelfNote(
      res.ok
        ? res.shared
          ? `Shelf ${code} is up. Open Gloss on the other device and join this code.`
          : `Saved here. The shared copy needs a GitHub token on the server — export a file in the meantime.`
        : res.error,
    );
  };

  const onJoin = async () => {
    const code = join.trim();
    if (!code) return;
    const res = await downloadShelf(code);
    if (!res.ok) {
      setShelfNote(res.error);
      return;
    }
    mergeArticles(res.articles);
    setShelfCode(code.toUpperCase().replace(/[^A-Z0-9]/g, ""));
    setShelfNote(`Joined ${code}. ${res.articles.length} pieces on this tablet now.`);
  };

  const onPull = async () => {
    if (!shelfCode) return;
    const res = await downloadShelf(shelfCode);
    if (!res.ok) {
      setShelfNote(res.error);
      return;
    }
    mergeArticles(res.articles);
    setShelfNote(`Pulled ${res.articles.length} pieces.`);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close library"
        className="absolute inset-0 bg-ink/30"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 flex max-h-[90dvh] w-full max-w-3xl flex-col rounded-t-lg bg-paper sm:rounded-lg hairline-strong">
        <header className="flex items-center justify-between border-b border-rule px-5 py-3">
          <div>
            <p className="caps">Library</p>
            <h2 className="font-serif text-xl font-medium">Your shelf</h2>
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

        <div className="ink-scroll min-h-0 flex-1">
          <div className="border-b border-rule px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setImportOpen(true);
              }}
              className="flex h-12 w-full items-center justify-center rounded-md bg-ink font-sans text-sm font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96]"
            >
              Bring a page
            </button>
            <p className="mt-2 font-serif text-sm text-ink-soft">
              Paste a blog link. Gloss reads it and fills the right column.
            On this tablet you can also Share from Chrome to Gloss.
            </p>
          </div>

          <Section title="Yours" empty={custom.length === 0}>
            {custom.length === 0 ? (
              <p className="px-5 py-6 font-serif text-md text-ink-soft">
                Nothing of yours yet. Bring a page and it will live here.
              </p>
            ) : (
              <ul className="divide-y divide-rule">
                {custom.map((article) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    current={current.id === article.id}
                    onOpen={() => openArticle(article.id)}
                    onRemove={() => removeArticle(article.id)}
                  />
                ))}
              </ul>
            )}
          </Section>

          <Section title="Included">
            <ul className="divide-y divide-rule">
              {SEED_ARTICLES.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  current={current.id === article.id}
                  onOpen={() => openArticle(article.id)}
                />
              ))}
            </ul>
          </Section>

          <Section title="This shelf">
            <div className="space-y-3 px-5 pb-5">
              <p className="font-serif text-sm leading-snug text-ink-soft">
                One code, two devices. Clip on the phone, read in bed.
              </p>
              {shelfCode ? (
                <button
                  type="button"
                  className="font-sans text-lg tracking-[0.2em] text-ink"
                  onClick={() => {
                    void navigator.clipboard?.writeText(shelfCode);
                    setShelfNote("Code copied. Join it on the other device.");
                  }}
                >
                  {shelfCode}
                </button>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="hairline h-10 rounded-md px-3 font-sans text-sm" onClick={() => void onMakeShelf()}>
                  {shelfCode ? "Push this tablet" : "Make a shared shelf"}
                </button>
                {shelfCode ? (
                  <button type="button" className="hairline h-10 rounded-md px-3 font-sans text-sm" onClick={() => void onPull()}>
                    Pull
                  </button>
                ) : null}
                <button type="button" className="hairline h-10 rounded-md px-3 font-sans text-sm" onClick={onExport}>
                  Export a file
                </button>
                <label className="hairline flex h-10 cursor-pointer items-center rounded-md px-3 font-sans text-sm">
                  Import a file
                  <input
                    type="file"
                    accept="application/json,.json,.gloss"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onImportFile(file);
                    }}
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  value={join}
                  onChange={(e) => setJoin(e.target.value.toUpperCase())}
                  placeholder="Join a code"
                  data-allow-select
                  className="h-10 min-w-0 flex-1 rounded-md border border-rule bg-paper px-3 font-sans text-sm tracking-[0.16em] outline-none"
                />
                <button type="button" className="hairline h-10 rounded-md px-3 font-sans text-sm" onClick={() => void onJoin()}>
                  Join
                </button>
              </div>
              {shelfNote ? <p className="font-serif text-sm text-ink-soft">{shelfNote}</p> : null}
            </div>
          </Section>

          <ImportTimes />

          <div className="border-t border-rule px-5 py-4 font-serif text-sm leading-snug text-ink-soft">
            <p className="caps text-ink-faint">On the DC-1</p>
            <p className="mt-2">
              Install the app from the file below, or pin this page from the
              tablet’s browser.
            </p>
            <a
              href="/gloss.apk"
              download="gloss.apk"
              className="mt-3 inline-flex h-10 items-center font-sans text-sm font-medium text-ink underline decoration-1 underline-offset-2"
            >
              Download Gloss for the DC-1
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportTimes() {
  const rows = loadImportLog();
  if (rows.length === 0) {
    return (
      <Section title="How long it takes">
        <p className="px-5 pb-5 font-serif text-sm text-ink-soft">
          Each time you bring a page, we keep how long the wait was — opening,
          teaching, drawing. After a few imports we’ll know if the beaver sits
          too long.
        </p>
      </Section>
    );
  }
  return (
    <Section title="How long it takes">
      <div className="px-5 pb-5">
        <p className="font-serif text-sm text-ink-soft">{summarizeLog(rows)}</p>
        <ul className="mt-3 space-y-2">
          {rows.slice(0, 8).map((row) => (
            <li key={row.at} className="font-serif text-sm leading-snug">
              <span className="text-ink">{row.title}</span>
              <span className="text-ink-soft">
                {" "}
                · {seconds(row.ms.total)}
                {row.ms.fetch != null ? ` · open ${seconds(row.ms.fetch)}` : ""}
                {row.ms.teach != null ? ` · teach ${seconds(row.ms.teach)}` : ""}
                {row.ms.draw != null ? ` · draw ${seconds(row.ms.draw)}` : ""}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-3 font-sans text-sm underline decoration-1 underline-offset-2"
          onClick={() => {
            void navigator.clipboard?.writeText(formatLogForChat(rows));
          }}
        >
          Copy the log
        </button>
      </div>
    </Section>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("border-b border-rule", empty && "bg-paper-raised/40")}>
      <p className="caps px-5 pt-4 pb-2">{title}</p>
      {children}
    </section>
  );
}

function ArticleRow({
  article,
  current,
  onOpen,
  onRemove,
}: {
  article: Article;
  current: boolean;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  const host = hostOf(article.url);
  const added = addedLabel(article.addedAt);
  return (
    <li className="flex items-stretch">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex-1 px-5 py-4 text-left",
          current ? "bg-paper-sunken" : "bg-paper",
        )}
      >
        <p className="caps">
          {article.custom ? host ?? "Brought in" : article.source}
          {article.custom && added ? ` · ${added}` : ""}
        </p>
        <p className="mt-1 font-serif text-lg font-medium leading-snug">
          {article.title}
        </p>
        <p className="mt-1 font-serif text-sm text-ink-soft">{article.dek}</p>
        <p className="mt-2 font-sans text-meta text-ink-faint">
          {article.minutes} min
          {article.terms.length > 0
            ? ` · ${article.terms.length} words taught`
            : ""}
        </p>
      </button>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${article.title}`}
          onClick={onRemove}
          className="flex w-12 items-center justify-center text-ink-faint"
        >
          <Trash2 className="size-4" strokeWidth={1.6} />
        </button>
      ) : null}
    </li>
  );
}

export function ImportSheet() {
  const open = useReader((s) => s.importOpen);
  const setOpen = useReader((s) => s.setImportOpen);
  const addArticle = useReader((s) => s.addArticle);
  const shelfCode = useReader((s) => s.shelfCode);

  const [url, setUrl] = useState("");
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState<"fetch" | "teach" | "draw" | null>(null);
  const [drawProgress, setDrawProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const onFile = async (file: File) => {
    const text = await file.text();
    setRaw(text);
  };

  const finish = async (
    title: string,
    dek: string,
    source: string,
    blocks: Article["blocks"],
    pageUrl?: string,
    origin?: Article["origin"],
  ) => {
    const flat = flattenBlocks(blocks);
    setBusy("teach");
    const t0 = performance.now();
    const result = await teachPassage(title, flat.slice(0, 16000));
    const teachMs = Math.round(performance.now() - t0);
    if (!result.ok) {
      recordImport({
        title,
        via: "paste",
        ok: false,
        error: result.error,
        ms: { teach: teachMs, total: teachMs },
      });
      setError(result.error);
      setBusy(null);
      return;
    }
    const used = new Set<string>();
    const terms: Term[] = result.analysis.terms.map((t) => {
      let id = termId(t.term);
      let n = 2;
      while (used.has(id)) id = `${termId(t.term)}-${n++}`;
      used.add(id);
      return {
        id,
        term: t.term,
        aliases: t.aliases ?? [],
        gloss: t.gloss,
        explanation: t.explanation,
        analogy: t.analogy,
        context: t.context,
        excerpt: t.excerpt,
        related: t.related ?? [],
        diagram: t.diagram,
        source: "auto" as const,
      };
    });
    const article: Article = {
      id: `custom-${Date.now()}`,
      title: result.analysis.title || title,
      dek: result.analysis.dek || dek,
      source,
      minutes: Math.max(1, Math.round(flat.split(/\s+/).length / 220)),
      custom: true,
      url: pageUrl,
      addedAt: Date.now(),
      field: result.analysis.field,
      origin,
      blocks,
      terms,
    };
    addArticle(article);
    let drawMs: number | undefined;
    let boards = 0;
    if (isOnline() && article.terms.length) {
      setBusy("draw");
      const d0 = performance.now();
      await prewarmBoards(article.id, article.terms, (done, total) => {
        setDrawProgress(`${done} of ${total}`);
        boards = total;
      });
      drawMs = Math.round(performance.now() - d0);
    }
    if (shelfCode) void uploadShelf(shelfCode, useReader.getState().customArticles);
    recordImport({
      title: article.title,
      via: "paste",
      ok: true,
      words: flat.split(/\s+/).length,
      terms: article.terms.length,
      boards,
      ms: { teach: teachMs, draw: drawMs, total: teachMs + (drawMs ?? 0) },
    });
    setUrl("");
    setRaw("");
    setBusy(null);
    setOpen(false);
  };

  const onBring = async () => {
    setError(null);
    const fromField = looksLikeUrl(url);
    const fromPaste = !raw.includes("\n") && looksLikeUrl(raw);
    const href = fromField ?? fromPaste;

    try {
      if (href) {
        if (!isOnline()) {
          setError("A link needs a connection. Paste the words themselves and we can still teach them here.");
          return;
        }
        setBusy("fetch");
        const t0 = performance.now();
        const brought = await ingestUrl(href);
        if (!brought.ok) {
          recordImport({
            title: href,
            url: href,
            via: "link",
            ok: false,
            error: brought.error,
            ms: {
              fetch: brought.timing.fetchMs,
              teach: brought.timing.teachMs,
              total: Math.round(performance.now() - t0),
            },
          });
          setError(brought.error);
          setBusy(null);
          return;
        }
        addArticle(brought.article);
        let drawMs: number | undefined;
        let boards = 0;
        if (isOnline() && brought.article.terms.length) {
          setBusy("draw");
          const d0 = performance.now();
          await prewarmBoards(brought.article.id, brought.article.terms, (done, total) => {
            setDrawProgress(`${done} of ${total}`);
            boards = total;
          });
          drawMs = Math.round(performance.now() - d0);
        }
        if (shelfCode) {
          void uploadShelf(shelfCode, useReader.getState().customArticles);
        }
        recordImport({
          title: brought.article.title,
          url: brought.article.url,
          via: "link",
          ok: true,
          words: flattenBlocks(brought.article.blocks).split(/\s+/).length,
          terms: brought.article.terms.length,
          boards,
          ms: {
            fetch: brought.timing.fetchMs,
            teach: brought.timing.teachMs,
            draw: drawMs,
            total: Math.round(performance.now() - t0),
          },
        });
        setUrl("");
        setRaw("");
        setBusy(null);
        setOpen(false);
        return;
      }
      if (raw.trim().length < 40) {
        setError("Paste a link, or a paragraph or two of the article.");
        return;
      }
      const parsed = parseImportedText(raw);
      await finish(parsed.title, "", "Brought in", parsed.blocks);
    } catch {
      setError("Could not bring that in. Try again, or paste the text.");
      setBusy(null);
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
            <p className="caps">Bring a page</p>
            <h2 className="font-serif text-xl font-medium">
              A link, or the words themselves
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={!!busy}
            onClick={() => setOpen(false)}
            className="flex size-11 items-center justify-center"
          >
            <X className="size-5" strokeWidth={1.6} />
          </button>
        </header>
        <div className="ink-scroll min-h-0 flex-1 space-y-4 px-4 py-4">
          {busy ? (
            <BeaverWait
              line={
                busy === "fetch"
                  ? "Opening the page"
                  : busy === "draw"
                    ? "Drawing the boards"
                    : "Teaching the jargon"
              }
              detail={busy === "draw" ? drawProgress : "The beaver is reading. This can take a minute."}
            />
          ) : (
          <>
          <p className="font-serif text-md leading-reading text-ink-soft">
            Paste any public blog or article link — software, law, biology,
            economics, whatever you are teaching yourself. Gloss opens the
            page, keeps the writing (and the publication’s type, if it can),
            and fills the right column. If the live page is gated, it looks
            for a public archived copy.
          </p>
          <label className="block">
            <span className="caps">Link</span>
            <input
              type="url"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              data-allow-select
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="mt-1 h-12 w-full rounded-md border border-rule bg-paper px-3 font-sans text-md text-ink outline-none focus-visible:border-ink"
            />
          </label>
          <div>
            <p className="caps">Or paste the article</p>
            <label className="hairline mt-1 flex h-11 cursor-pointer items-center justify-center rounded-md bg-paper-raised font-sans text-sm font-medium">
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
              rows={8}
              data-allow-select
              className="mt-2 w-full resize-y rounded-md border border-rule bg-paper px-3 py-3 font-serif text-md leading-reading text-ink outline-none focus-visible:border-ink"
            />
          </div>
          {error ? <p className="font-sans text-sm text-ink">{error}</p> : null}
          </>
          )}
        </div>
        {busy ? null : (
        <footer className="border-t border-rule p-3">
          <button
            type="button"
            onClick={() => void onBring()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink font-sans text-sm font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            Bring it in
          </button>
        </footer>
        )}
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
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex justify-end px-6">
      <div className="pointer-events-auto hairline-strong w-[min(22rem,34vw)] rounded-md bg-paper px-4 py-3">
        <p className="font-serif text-md leading-snug text-ink">
          Underlined words already have a note — tap one. Any other word: tap
          twice. Tap again to take the phrase, the sentence, the paragraph. Tap
          away to keep reading.
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
