import { useEffect, useState } from "react";
import { drawTerm } from "@/lib/illustrate";
import type { Term } from "@/lib/types";

export function BoardFigure({ term }: { term: Term }) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "drawing" | "ready" | "hidden">(
    "idle",
  );

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setStatus("drawing");
    drawTerm(term.term, term.analogy, term.explanation, term.context, term.diagram)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setUrl(result.url);
          setStatus("ready");
        } else {
          setStatus("hidden");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("hidden");
      });
    return () => {
      cancelled = true;
    };
  }, [term.id, term.term, term.analogy, term.explanation, term.context, term.diagram]);

  if (status === "hidden") return null;

  return (
    <section className="mb-10">
      <p className="caps mb-2">On the board</p>
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
      {status === "ready" && term.diagram?.caption ? (
        <p className="mt-2 font-serif text-sm italic leading-snug text-ink-soft text-pretty">
          {term.diagram.caption}
        </p>
      ) : null}
    </section>
  );
}
