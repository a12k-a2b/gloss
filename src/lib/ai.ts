import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const diagramSchema = z.object({
  title: z.string(),
  caption: z.string(),
  lanes: z
    .array(
      z.object({
        label: z.string().optional(),
        nodes: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            kind: z.enum(["box", "cloud", "actor", "note"]).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            from: z.string(),
            to: z.string(),
            label: z.string().optional(),
            dashed: z.boolean().optional(),
          }),
        ),
      }),
    )
    .min(1)
    .max(3),
});

const termSchema = z.object({
  term: z.string(),
  aliases: z.array(z.string()).default([]),
  gloss: z.string(),
  explanation: z.string(),
  analogy: z.string(),
  context: z.string(),
  excerpt: z.string(),
  related: z.array(z.string()).default([]),
  diagram: diagramSchema,
});

const analysisSchema = z.object({
  title: z.string(),
  dek: z.string(),
  field: z.string().default("this field"),
  reader: z.string().default("a curious adult new to this subject"),
  terms: z.array(termSchema).min(1).max(28),
});

export type AnalysisResult = z.infer<typeof analysisSchema>;

const analyzeInput = z.object({
  title: z.string(),
  text: z.string().min(40).max(20000),
});

export const analyzePassage = createServerFn({ method: "POST" })
  .validator((input: unknown) => analyzeInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "Teaching notes need an AI key, which is not available here.",
      };
    }

    const prompt = `You are Gloss, the teacher who sits in the margin of a paper study reader.

The reader is a bright adult teaching themselves a field they were not trained in. They may later become dangerous in that field. They are not stupid. They are new.

You work across graduate-level writing: software, AI, engineering, economics, law, medicine, biology, chemistry, physics, mathematics, business, political theory. Same job in every field.

1. Name the field in 1–3 words (software, constitutional law, cell biology, …).
2. Name the assumed reader in one sentence.
3. Choose 14–24 things that reader would actually stop on.

INCLUDE
- Terms of art, including ordinary English used in a special sense (consideration, interest, charge, expression, work, train, demand).
- Multi-word concepts that are the real unit, including lowercase ones that look like ordinary English or Latin: due process, habeas corpus, comparative advantage, gene expression, in vitro, wave function, null hypothesis, pull request, private CA, gradient descent. Brown v. Board is one unit, not two names.
- Named methods, systems, theorems, cases, instruments, protocols.
- Abbreviations the passage treats as already known (GDP, PCR, EBITDA, DNA) — as aliases of the long form when the long form is there.

EXCLUDE
- Everyday words used in the everyday sense.
- The author's name as a person.
- Dates, cities, page furniture, "I", "we".
- A word you already taught under a better multi-word name.

THE UNIT IS THE THING
- If the idea is two or more words, the term string MUST be those words together ("due process", "pull request", "private CA", "gradient descent"). Never emit the inner word as its own term.
- If the passage writes an expansion and an acronym — "certificate authority (CA)" or "CA (certificate authority)" — the term is the expansion, and the acronym is an alias. One card. One underline on the first full unit.
- If you would teach both "process" and "due process", keep only "due process" and put "process" in aliases only if the short word is used alone for the same idea.
- Underline budget is scarce. 14–22 terms. Prefer a phrase over a lonely word. Prefer a concept over a brand.

Prefer the first occurrence of the real unit. Prefer concepts over brand names, unless the brand is the concept (Kubernetes, CRISPR, Keynes).

For software and AI writing (a common case on this reader): assume they have never opened a terminal and do not work on a software team. Still pick concepts (daemon, mesh, hostNetwork), not only product names.

For each term:
- gloss: one sentence, ≤ 160 characters, concrete, a little dry-playful. No dictionary throat-clearing. Do not use another unexplained jargon word.
- explanation: 2–4 sentences. Plain words first. If you must use a technical word, define it in the same breath.
- analogy: one everyday picture from OUTSIDE the field (kitchen, mail, city, sports, music, a school). Commit to it. Never explain a term with a sibling term from the same field.
- context: what THIS passage is using the word to do. Quote the job, not the textbook.
- excerpt: a short phrase copied from the passage where the term appears.
- aliases: other surface forms in the passage (empty array if none).
- related: 1–3 other term strings from your own list.
- diagram: a 1 or 2 lane ink diagram.
  - Each lane is a left-to-right story (3 nodes is ideal, 2–4 allowed).
  - node.label: short, use \\n for a second line.
  - node.kind: box | cloud | actor | note
  - edges must reference node ids in that same lane.
  - caption: one sentence under the figure.

Voice: a seminar teacher talking to a bright friend between classes. Not Wikipedia. Not a children's book. Never condescending. Never start with "So basically."

Return ONLY JSON matching:
{
  "title": string,
  "dek": string (one-line subtitle),
  "field": string,
  "reader": string,
  "terms": [ { term, aliases, gloss, explanation, analogy, context, excerpt, related, diagram } ]
}

PASSAGE TITLE: ${data.title}

PASSAGE:
${data.text}`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 6000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write pedagogical margin notes as strict JSON for a bright adult new to a field. No markdown fences.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      return {
        ok: false as const,
        error: `The teacher is unavailable (${res.status}).`,
      };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = body.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = analysisSchema.parse(JSON.parse(raw));
      return { ok: true as const, analysis: parsed };
    } catch {
      return {
        ok: false as const,
        error: "The teacher returned notes I could not file. Try a shorter passage.",
      };
    }
  });

const illustrateInput = z.object({
  term: z.string(),
  analogy: z.string(),
  explanation: z.string(),
  context: z.string().optional(),
  panels: z.array(z.string()).max(4).optional(),
  caption: z.string().optional(),
});

function teachingFigurePrompt(data: {
  term: string;
  analogy: string;
  explanation: string;
  context?: string;
  panels?: string[];
  caption?: string;
}): string {
  const panels = (data.panels ?? []).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const strip =
    panels.length >= 3
      ? `Exactly THREE panels in a row, left to right, like a textbook strip.
Panel 1 (left): ${panels[0]}
Panel 2 (middle): ${panels[1]}
Panel 3 (right): ${panels[2]}
A small arrow between each panel.`
      : `Exactly TWO panels, side by side, like a professor’s before/after on a whiteboard.
LEFT panel (“before”): ${panels[0] || `the everyday situation without ${data.term}`}
RIGHT panel (“after”): ${panels[1] || data.analogy}
A single arrow in the gutter from left to right, labeled “then” if anything.`;

  return `A teaching figure for a grayscale reflective LCD (paper-white tablet).
Black ink on cream paper only. No color, no watercolor, no photography, no 3D, no glossy UI, no decorative scenery, no title banner, no logo, no banana.
${strip}
Each panel is a simple scene or mechanism, not a wall of text. Labels: 1–3 words, hand-lettered, large.
Thick confident lines. Lots of unused paper. Must still read when the whole image is gray.
Concept: "${data.term}"
Everyday picture: ${data.analogy}
What it is: ${data.explanation.slice(0, 280)}
${data.context ? `How this essay uses it: ${data.context.slice(0, 180)}` : ""}
${data.caption ? `One-line figure caption (do not letter this on the drawing): ${data.caption}` : ""}`;
}
  return `A teaching figure for a grayscale reflective LCD (paper-white tablet).
Black ink on cream paper only. No color, no watercolor, no photography, no 3D, no glossy UI mockup, no decorative scenery.
Like a professor’s whiteboard or a field-guide diagram drawn in one pass.
Show the MECHANISM as a short sequence: 2–5 labeled boxes or parts, arrows, one everyday metaphor drawn simply.
Labels: 1–3 words. Thick confident lines. Lots of unused paper. Must still read when the whole image is gray.
Concept: "${data.term}"
Everyday picture: ${data.analogy}
What it is: ${data.explanation.slice(0, 320)}
${data.context ? `How this essay uses it: ${data.context.slice(0, 220)}` : ""}
Do not write a title banner. Do not draw a banana. Do not add a logo.`;
}

function dataUrlFromBase64(data: string, mime = "image/png"): string {
  const clean = data.replace(/\s+/g, "");
  return `data:${mime};base64,${clean}`;
}

async function drawWithNanoBanana(prompt: string): Promise<string | null> {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-image:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(28000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "3:2" },
        },
      }),
    },
  );
  if (!res.ok) return null;
  const body = (await res.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] };
    }[];
  };
  const part = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData?.data) return null;
  return dataUrlFromBase64(part.inlineData.data, part.inlineData.mimeType ?? "image/png");
}

async function drawWithGrok(prompt: string): Promise<string | null> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return null;
  const res = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(28000),
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt,
      n: 1,
      aspect_ratio: "3:2",
      response_format: "url",
    }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data?: { url?: string }[] };
  return body.data?.[0]?.url ?? null;
}

export const illustrateTerm = createServerFn({ method: "POST" })
  .validator((input: unknown) => illustrateInput.parse(input))
  .handler(async ({ data }) => {
    const prompt = teachingFigurePrompt(data);
    try {
      const banana = await drawWithNanoBanana(prompt);
      if (banana) return { ok: true as const, url: banana };
      const grok = await drawWithGrok(prompt);
      if (grok) return { ok: true as const, url: grok };
      return {
        ok: false as const,
        error: "No illustrator key is set (Gemini or xAI).",
      };
    } catch {
      return { ok: false as const, error: "The board is busy. Try again in a moment." };
    }
  });

const explainInput = z.object({
  phrase: z.string().min(1).max(800),
  kind: z.enum(["word", "phrase", "sentence", "paragraph"]),
  title: z.string(),
  surrounding: z.string().max(2000),
});

export const explainSpan = createServerFn({ method: "POST" })
  .validator((input: unknown) => explainInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "The teacher is offline here.",
      };
    }

    const job =
      data.kind === "word"
        ? `Explain the word or name "${data.phrase}" as it is used in this passage — including the special sense if an ordinary word is doing technical work.`
        : data.kind === "phrase"
          ? `Explain the phrase "${data.phrase}" as a unit — the term of art, not each word separately.`
          : data.kind === "sentence"
            ? `Explain what this sentence is doing, in plain language. Teach the idea, not a dictionary.`
            : `Give the gist of this paragraph and the two or three ideas a reader new to this field would trip on.`;

    const prompt = `You are Gloss, the teacher in the margin of a paper study reader. A bright adult teaching themselves a field they were not trained in pointed at something they do not understand. Infer the field from the title and surrounding text. Same job whether this is software, law, medicine, economics, biology, physics, or anything else.

${job}

Rules:
- gloss: one sentence, ≤ 160 characters, concrete. No other unexplained jargon.
- explanation: 2–5 sentences. Plain words first. If you must use a technical word, define it immediately.
- analogy: one everyday picture from OUTSIDE the field. Commit to it.
- context: what THIS passage is using it to do.
- excerpt: a short quote from the surrounding text.
- related: empty array, or 1–3 nearby ideas as short strings.
- diagram: 1 lane, 2–4 nodes, ink-textbook simple.
- term: a short title (the word/phrase, or "This sentence" / "This paragraph").
- aliases: []

Voice: a seminar teacher talking to a bright friend. Never condescending. Never "So basically."

Return ONLY JSON for one term:
{ term, aliases, gloss, explanation, analogy, context, excerpt, related, diagram }

PASSAGE TITLE: ${data.title}

THEY POINTED AT (${data.kind}):
${data.phrase}

SURROUNDING:
${data.surrounding}`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.35,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You write one pedagogical margin note as strict JSON. No markdown fences.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      return {
        ok: false as const,
        error: `The teacher is unavailable (${res.status}).`,
      };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = body.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = termSchema.parse(JSON.parse(raw));
      return { ok: true as const, term: parsed };
    } catch {
      return {
        ok: false as const,
        error: "The teacher mumbled. Try asking again.",
      };
    }
  });
