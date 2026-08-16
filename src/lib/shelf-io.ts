import { createServerFn } from "@tanstack/react-start";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { Article } from "@/lib/types";

const DIR = join(process.cwd(), "data", "shelves");
const REPO = process.env.GITHUB_SHELF_REPO || "a12k-a2b/gloss";
const BRANCH = process.env.GITHUB_SHELF_BRANCH || "main";

const payload = z.object({
  code: z.string().min(4).max(12),
  articles: z.array(z.any()).max(80),
});

function cleanCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function token(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

/** Sync payload: the essay and the notes. Origin CSS/photos stay on-device. */
function compactForSync(articles: Article[]): Article[] {
  return articles.map((a) => ({
    ...a,
    origin: undefined,
  }));
}

async function pathFor(code: string): Promise<string> {
  await mkdir(DIR, { recursive: true });
  return join(DIR, `${code}.json`);
}

async function writeLocal(code: string, body: string) {
  await writeFile(await pathFor(code), body);
}

async function readLocal(code: string): Promise<string | null> {
  try {
    return await readFile(await pathFor(code), "utf8");
  } catch {
    return null;
  }
}

async function githubGetSha(path: string): Promise<string | undefined> {
  const t = token();
  if (!t) return;
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${t}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "gloss-shelf",
      },
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!res.ok) return;
  const body = (await res.json()) as { sha?: string };
  return body.sha;
}

async function writeGithub(code: string, body: string): Promise<boolean> {
  const t = token();
  if (!t) return false;
  const path = `data/shelves/${code}.json`;
  const sha = await githubGetSha(path);
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${t}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "gloss-shelf",
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      message: `shelf ${code}`,
      content: Buffer.from(body).toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  return res.ok;
}

async function readGithub(code: string): Promise<string | null> {
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/data/shelves/${code}.json`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "gloss-shelf", Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export const pushShelf = createServerFn({ method: "POST" })
  .validator((input: unknown) => payload.parse(input))
  .handler(async ({ data }) => {
    const code = cleanCode(data.code);
    if (code.length < 4) return { ok: false as const, error: "That code is too short." };
    const articles = compactForSync(data.articles as Article[]);
    const body = JSON.stringify({ v: 1, updatedAt: Date.now(), articles });
    await writeLocal(code, body);
    const remote = await writeGithub(code, body);
    return {
      ok: true as const,
      count: articles.length,
      shared: remote,
    };
  });

export const pullShelf = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ code: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const code = cleanCode(data.code);
    const raw = (await readLocal(code)) ?? (await readGithub(code));
    if (!raw) return { ok: false as const, error: "No shelf with that code yet." };
    try {
      const body = JSON.parse(raw) as { articles?: Article[] };
      return { ok: true as const, articles: body.articles ?? [] };
    } catch {
      return { ok: false as const, error: "That shelf file is damaged." };
    }
  });
