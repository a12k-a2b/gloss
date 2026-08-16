import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { pickArticleHtml, articleTextFromHtml } from "../src/lib/pick-article.ts";

const CASES = [
  {
    id: "quanta-aging",
    url: "https://www.quantamagazine.org/why-aging-may-be-a-program-not-a-breakdown-20260814/",
    must: ["Why Aging May Be a Program", "we know aging when we see it"],
    mustNot: ["Most recent comments", "Save Article", "Copy link", "Read Later"],
  },
  {
    id: "ieee-llm",
    url: "https://spectrum.ieee.org/large-language-models",
    must: ["large language models"],
    mustNot: ["Aerospace", "Most recent comments"],
  },
];

const dir = new URL("../tests/fixtures/", import.meta.url);

function loadFixture(id) {
  const gz = new URL(`${id}.html.gz`, dir);
  const raw = new URL(`${id}.html`, dir);
  if (existsSync(gz)) return gunzipSync(readFileSync(gz)).toString("utf8");
  if (existsSync(raw)) return readFileSync(raw, "utf8");
  return null;
}

const results = [];
for (const c of CASES) {
  const html = loadFixture(c.id);
  const row = { id: c.id, ok: false, missing: [], leaked: [], words: 0 };
  if (!html) {
    row.error = "no fixture";
    results.push(row);
    continue;
  }
  const picked = pickArticleHtml(html, c.url);
  const text = articleTextFromHtml(picked);
  row.words = text.split(/\s+/).length;
  row.missing = c.must.filter((s) => !text.includes(s) && !picked.includes(s));
  row.leaked = c.mustNot.filter((s) => text.includes(s) || picked.includes(s));
  row.ok = row.missing.length === 0 && row.leaked.length === 0;
  row.start = text.slice(0, 140);
  results.push(row);
}

const report = { when: new Date().toISOString(), results };
mkdirSync("/workspace/screenshots", { recursive: true });
writeFileSync("/workspace/screenshots/parser-health.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (results.some((r) => !r.ok)) process.exitCode = 1;
