const KEY = "gloss-import-log-v1";
const MAX = 40;

export type ImportVia = "link" | "paste" | "share";

export type ImportTiming = {
  at: number;
  title: string;
  url?: string;
  host?: string;
  ok: boolean;
  error?: string;
  via: ImportVia;
  words?: number;
  terms?: number;
  boards?: number;
  ms: {
    fetch?: number;
    teach?: number;
    draw?: number;
    total: number;
  };
};

function hostOf(url?: string): string | undefined {
  if (!url) return;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return;
  }
}

export function loadImportLog(): ImportTiming[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ImportTiming[]) : [];
  } catch {
    return [];
  }
}

export function recordImport(entry: Omit<ImportTiming, "at" | "host"> & { at?: number }): ImportTiming {
  const row: ImportTiming = {
    ...entry,
    at: entry.at ?? Date.now(),
    host: hostOf(entry.url),
  };
  const next = [row, ...loadImportLog()].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  return row;
}

export function seconds(ms?: number): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(ms >= 10_000 ? 0 : 1)}s`;
}

export function summarizeLog(rows: ImportTiming[]): string {
  const ok = rows.filter((r) => r.ok);
  if (ok.length === 0) return "No successful imports yet.";
  const totals = ok.map((r) => r.ms.total);
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  const max = Math.max(...totals);
  const draws = ok.filter((r) => r.ms.draw != null);
  const drawAvg = draws.length
    ? draws.reduce((a, r) => a + (r.ms.draw ?? 0), 0) / draws.length
    : 0;
  return `${ok.length} imports · avg ${seconds(avg)} · longest ${seconds(max)}${
    draws.length ? ` · boards avg ${seconds(drawAvg)}` : ""
  }`;
}

export function formatLogForChat(rows: ImportTiming[]): string {
  const lines = [
    summarizeLog(rows),
    "",
    ...rows.slice(0, 20).map((r) => {
      const bits = [
        r.ok ? "ok" : "fail",
        r.host ?? r.via,
        `total ${seconds(r.ms.total)}`,
        r.ms.fetch != null ? `open ${seconds(r.ms.fetch)}` : null,
        r.ms.teach != null ? `teach ${seconds(r.ms.teach)}` : null,
        r.ms.draw != null ? `draw ${seconds(r.ms.draw)} (${r.boards ?? 0})` : null,
        r.terms != null ? `${r.terms} words` : null,
        r.error,
      ].filter(Boolean);
      return `${r.title.slice(0, 48)} — ${bits.join(" · ")}`;
    }),
  ];
  return lines.join("\n");
}
