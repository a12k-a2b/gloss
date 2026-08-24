# Gloss

A two-column study reader for paper screens — built for the [Daylight Computer DC-1](https://daylightcomputer.com/).

The essay is on one side. The other side is a teacher’s margin: a two-sentence note for the jargon on *this* page. Swipe a word for the longer lesson (analogy, diagram, a sketch). Tap **I know this** and the underline leaves — in this essay and the next.

Missed a word? Tap it twice. Tap again to take the phrase, the sentence, the paragraph. Tap empty paper to keep reading.

Default essay: [I’m a Happy engineer now](https://blog.denv.it/posts/im-happy-engineer-now/) by Denys Vitali.

## Share this

**Repo (code):** https://github.com/a12k-a2b/gloss

This is the source. It is not a hosted website — a friend clones it and runs it, or you send them the APK.

## Run it

```bash
npm install
cp .env.example .env   # add XAI_API_KEY and/or GEMINI_API_KEY
npm run dev
```

Open the URL Vite prints (default `http://localhost:8080`).

```bash
npm run typecheck
npm run build
```

## What to try

- Read the Happy essay. Glance at the margin. Tap **I know this** on a word you already have.
- Swipe a card either way for the long lesson; swipe it away to come back.
- Double-tap a word that is *not* underlined. Tap the wash again to widen.
- The two-arrow icon swaps which side is the essay.
- The book-with-plus brings in any public URL. The first page is taught first; the rest arrives while you read.
- On the DC-1, Share from Chrome into Gloss.

## The board (Nano Banana 2)

When you swipe into a word, Gloss asks **Nano Banana 2** (Google’s fast, cheap image model — `gemini-3.1-flash-lite-image`) for a teaching figure. It only fires then, not for every word in the essay, so it stays cheap.

If the idea has a before/after or a sequence, you get a two- or three-panel strip — the kind a teacher would sketch on a whiteboard. Ink on cream paper, no color, so it holds on a DC-1. The figure sits at the bottom of the lesson; by the time you scroll down, it’s usually already there.

Needs a `GEMINI_API_KEY`. Offline, the ink diagram above it still works.

## Android / DC-1

```bash
npm run build:apk-web   # static bundle → dist-apk/
npm run build:apk       # Capacitor + Gradle → artifacts/gloss.apk
```

Sideload the APK: allow install from unknown sources, tap the file, open **Gloss**.

The two seeded essays and every margin note work offline. Teaching a *new* passage needs a key and a connection.

## Stack

React 19, TypeScript, Vite, TanStack Start, Tailwind v4, Zustand, Capacitor 6.

Keep the ink-on-paper rule: no color, no drop shadows, hairline rules, serif for the passage. The reading surface lives in `src/components/reader/`. Essays live in `src/data/articles.ts`.
