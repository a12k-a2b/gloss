import { useEffect, useState } from "react";
import { figureKey } from "@/lib/figure-store";
import { drawTerm } from "@/lib/illustrate";
import type { Term } from "@/lib/types";
import { useCurrentArticle } from "@/store/reader";

export function BoardFigure({ term }: { term: Term }) {
  const article = useCurrentArticle();
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "drawing" | "ready" | "offline">(
    "idle",
  );

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setStatus("drawing");
    drawTerm(
      term.term,
      term.analogy,
      term.explanation,
      term.context,
      term.diagram,
      figureKey(article.id, term.id),
    )
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setUrl(result.url);
          setStatus("ready");
        } else if (result.offline) {
          setStatus("offline");
        } else {
          setStatus("offline");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, [article.id, term.id, term.term, term.analogy, term.explanation, term.context, term.diagram]);

  if (status === "idle") return null;

  return (
    <section className="mb-10">
      <p className="caps mb-2">On the board</p>
      {status === "offline" ? (
        <p className="font-serif text-sm leading-snug text-ink-soft text-pretty">
          Connect to draw this figure. The ink diagram above still works.
        </p>
      ) : (
        <div className="board-frame">
          {status === "ready" && url ? (
            <img
              src={url}
              alt={`Before-and-after sketch of ${term.term}`}
              className="board-figure"
              crossOrigin="anonymous"
            />
          ) : (
            <p className="board-wait">Drawing the before and after…</p>
          )}
        </div>
      )}
      {status === "ready" && term.diagram?.caption ? (
        <p className="mt-2 font-serif text-sm italic leading-snug text-ink-soft text-pretty">
          {term.diagram.caption}
        </p>
      ) : null}
    </section>
  );
}
