import { useEffect, useRef, useState } from "react";
import type { Term } from "@/lib/types";

export type SpreadRow = {
  term: Term;
  phase: "in" | "out";
};

const LEAVE_MS = 640;

export function useSpreadTerms(
  prepared: Term[],
  visibleIds: string[],
  follow: boolean,
): SpreadRow[] {
  const [rows, setRows] = useState<SpreadRow[]>(() =>
    prepared.map((term) => ({ term, phase: "in" as const })),
  );
  const lastGood = useRef<string[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!follow) {
      for (const t of timers.current.values()) window.clearTimeout(t);
      timers.current.clear();
      setRows(prepared.map((term) => ({ term, phase: "in" })));
      return;
    }

    const live = visibleIds.length > 0 ? visibleIds : lastGood.current;
    if (visibleIds.length > 0) lastGood.current = visibleIds;
    const want = new Set(live);

    setRows((prev) => {
      const have = new Map(prev.map((r) => [r.term.id, r]));
      const next: SpreadRow[] = [];
      for (const term of prepared) {
        const existing = have.get(term.id);
        if (want.has(term.id)) {
          const pending = timers.current.get(term.id);
          if (pending) {
            window.clearTimeout(pending);
            timers.current.delete(term.id);
          }
          next.push({ term, phase: "in" });
        } else if (existing) {
          next.push({ term, phase: "out" });
          if (!timers.current.has(term.id)) {
            const id = term.id;
            timers.current.set(
              id,
              window.setTimeout(() => {
                timers.current.delete(id);
                setRows((cur) => cur.filter((r) => r.term.id !== id));
              }, LEAVE_MS),
            );
          }
        }
      }
      return next;
    });
  }, [prepared, visibleIds, follow]);

  useEffect(() => {
    return () => {
      for (const t of timers.current.values()) window.clearTimeout(t);
    };
  }, []);

  return rows;
}
