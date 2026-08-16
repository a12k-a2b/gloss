import { pullShelf, pushShelf } from "@/lib/shelf-io";
import type { Article } from "@/lib/types";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function mintShelfCode(): string {
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  return [...buf].map((n) => LETTERS[n % LETTERS.length]).join("");
}

export function compactForSync(articles: Article[]): Article[] {
  return articles.map((a) => ({ ...a, origin: undefined }));
}

export function packLibrary(articles: Article[]): string {
  return JSON.stringify({ v: 1, exportedAt: Date.now(), articles }, null, 2);
}

export function unpackLibrary(raw: string): Article[] {
  const data = JSON.parse(raw) as { articles?: Article[] };
  if (!Array.isArray(data.articles)) throw new Error("Not a Gloss shelf file.");
  return data.articles.filter((a) => a && typeof a.id === "string" && a.title);
}

export async function uploadShelf(code: string, articles: Article[]) {
  return pushShelf({ data: { code, articles: compactForSync(articles) } });
}

export async function downloadShelf(code: string) {
  return pullShelf({ data: { code } });
}
