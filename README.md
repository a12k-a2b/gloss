# Gloss

A two-column study reader for paper screens — built for the [Daylight Computer DC-1](https://daylightcomputer.com/).

The passage sits on the left. Jargon is underlined once, the first time it appears. The right column is a teacher’s margin: a short gloss, then a tap opens the full note — analogy, ink diagram, and why the word is here.

Missed a word? Tap it twice. The word takes a gray wash (not an underline — that’s for the prepared notes). Tap again to take the phrase, the sentence, the whole paragraph. Tap anywhere else in the passage to keep reading.

Default essay: [I’m a Happy engineer now](https://blog.denv.it/posts/im-happy-engineer-now/) by Denys Vitali. The companion networking post (Tailscale / Traefik / private CA) is in the library.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:8080`).

```bash
npm run typecheck
npm run build
```

## What to try

- Read the Happy essay. Tap **Happy**, then **micro-sessions**, then **YOLO mode**.
- Double-tap a word that is *not* underlined — **boilerplate**, **errands**, **commute**. Tap the gray wash again to widen.
- Tap away from the wash to put the book back.
- Open the library and switch to the Tailscale companion.
- On a phone-width window, use **Read / Words** to flip panes. Asking a word opens a sheet over the page.
- **Open a new passage** pastes HTML or text and asks the teacher to write notes (needs an `XAI_API_KEY` in the environment).

## Android / DC-1

The same app ships as a chrome-free Android wrapper (`com.gloss.reader`).

```bash
npm run build:apk-web   # static bundle → dist-apk/
npm run build:apk       # Capacitor + Gradle → artifacts/gloss.apk
```

`build:apk` expects an Android SDK. Sideload the APK on the DC-1: allow install from unknown sources, tap the file, open **Gloss**.

The two seeded essays and every margin note work offline. Teaching a *new* passage or asking a fresh word needs the online app for the richer notes; the tablet still writes a first-pass note from the sentence.

## Share with a friend

This repo is meant to be forked. The reading surface lives in `src/components/reader/`. Essays and terms live in `src/data/articles.ts`. Keep the ink-on-paper rule: no color, no drop shadows, hairline rules, serif for the passage.

## Stack

React 19, TypeScript, Vite, TanStack Start, Tailwind v4, Zustand, Capacitor 6 for Android.
