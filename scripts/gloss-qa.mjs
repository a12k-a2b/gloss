import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const results = [];

async function shot(name, viewport, fn) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("http://127.0.0.1:8080/", {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.waitForTimeout(600);
  if (fn) await fn(page);
  const path = `/workspace/screenshots/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const wide = doc.scrollWidth > doc.clientWidth + 2;
    const offenders = [];
    if (wide) {
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > doc.clientWidth + 4) {
          offenders.push({
            tag: el.tagName,
            cls: String(el.className || "").slice(0, 90),
            right: Math.round(r.right),
          });
          if (offenders.length >= 8) break;
        }
      }
    }
    return { wide, offenders, scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
  });
  const text = (await page.locator("body").innerText()).slice(0, 180);
  results.push({ name, viewport, errors, overflow, textStart: text, path });
  await page.close();
}

await shot("dc1-landscape", { width: 1600, height: 1200 });

await shot("dc1-expand", { width: 1600, height: 1200 }, async (page) => {
  await page.locator('[data-term-card="nat"]').click();
  await page.waitForTimeout(450);
});

await shot("dc1-portrait", { width: 1200, height: 1600 });

await shot("phone", { width: 390, height: 844 }, async (page) => {
  await page.waitForTimeout(200);
});

await shot("phone-words", { width: 390, height: 844 }, async (page) => {
  await page.getByRole("button", { name: "Words" }).click();
  await page.waitForTimeout(300);
});

await shot("library", { width: 1600, height: 1200 }, async (page) => {
  await page.getByRole("button", { name: "Library" }).click();
  await page.waitForTimeout(300);
});

console.log(JSON.stringify(results, null, 2));
await browser.close();

const bad = results.filter((r) => r.errors.length || r.overflow?.wide);
process.exit(bad.length ? 2 : 0);
