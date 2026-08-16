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
    drawTerm(term.term, term.analogy, term.explanation, term.context)
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
  }, [term.id, term.term, term.analogy, term.explanation, term.context]);

  if (status === "hidden") return null;

  return (
    <section className="mb-10">
      <p className="caps mb-2">On the board</p>
      <div className="board-frame">
        {status === "ready" && url ? (
          <img
            src={url}
            alt={`Whiteboard sketch of ${term.term}`}
            className="board-figure"
            crossOrigin="anonymous"
          />
        ) : (
          <p className="board-wait">Sketching a figure…</p>
        )}
      </div>
    </section>
  );
}
