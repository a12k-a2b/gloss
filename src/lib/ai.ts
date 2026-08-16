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

    const prompt = `You are Gloss, a patient, slightly wry teacher who sits in the margin of a book. You explain jargon so a curious adult can keep reading.

Read the passage. Pick 12–24 jargon terms or short phrases a curious adult who does not work in software would stumble on. Prefer multi-word names when they are the real unit (pull request, private CA, hostNetwork). Prefer terms that actually appear in the text.

For each term:
- gloss: one sentence, ≤ 160 characters, concrete, a little playful. No dictionary throat-clearing. Do not use another unexplained jargon word.
- explanation: 2–4 sentences. Plain words first. If you must use a technical word, define it in the same breath.
- analogy: one everyday picture (apartment, kitchen, mail, school). Commit to it.
- context: what THIS passage is using the word to do. Quote the job, not the Wikipedia page.
- excerpt: a short phrase copied from the passage where the term appears.
- aliases: other surface forms in the passage (empty array if none).
- related: 1–3 other term strings from your own list.
- diagram: a 1 or 2 lane ink diagram.
  - Each lane is a left-to-right story (3 nodes is ideal, 2–4 allowed).
  - node.label: short, use \\n for a second line.
  - node.kind: box | cloud | actor | note
  - edges must reference node ids in that same lane.
  - caption: one sentence under the figure.

Voice: a good teacher talking to a bright friend who has never opened a terminal. Not cute. Not Wikipedia. Never condescending. Never start with "So basically."

Return ONLY JSON matching:
{
  "title": string,
  "dek": string (one-line subtitle),
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
              "You write pedagogical margin notes as strict JSON. No markdown fences.",
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
});

export const illustrateTerm = createServerFn({ method: "POST" })
  .validator((input: unknown) => illustrateInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "Illustration is unavailable here.",
      };
    }

    const prompt = `A high-contrast pedagogical textbook figure drawn in black ink on cream paper. No color, no watercolor wash, no photorealism. Simple labeled line drawing that explains "${data.term}". Visual metaphor: ${data.analogy}. Keep labels to two or three short words. Generous white space, thick confident lines, the look of a figure from a well-printed field guide. ${data.explanation.slice(0, 280)}`;

    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-image",
        prompt,
        n: 1,
        aspect_ratio: "4:3",
        response_format: "url",
      }),
    });

    if (!res.ok) {
      return {
        ok: false as const,
        error: `Could not draw that (${res.status}).`,
      };
    }

    const body = (await res.json()) as {
      data?: { url?: string }[];
    };
    const url = body.data?.[0]?.url;
    if (!url) {
      return { ok: false as const, error: "The figure came back empty." };
    }
    return { ok: true as const, url };
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
        ? `Explain the word or name "${data.phrase}" as it is used in this passage.`
        : data.kind === "phrase"
          ? `Explain the phrase "${data.phrase}" as a unit — not each word separately.`
          : data.kind === "sentence"
            ? `Explain what this sentence is doing, in plain language. Teach the idea, not a dictionary.`
            : `Give the gist of this paragraph and the two or three ideas a non-technical reader would trip on.`;

    const prompt = `You are Gloss, a patient teacher in the margin of a book. A curious adult who does not work in computers pointed at something they do not understand.

${job}

Rules:
- gloss: one sentence, ≤ 160 characters, concrete. No other unexplained jargon.
- explanation: 2–5 sentences. Plain words first. If you must use a technical word, define it immediately.
- analogy: one everyday picture. Commit to it.
- context: what THIS passage is using it to do.
- excerpt: a short quote from the surrounding text.
- related: empty array, or 1–3 nearby ideas as short strings.
- diagram: 1 lane, 2–4 nodes, ink-textbook simple.
- term: a short title (the word/phrase, or "This sentence" / "This paragraph").
- aliases: []

Voice: a good teacher talking to a bright friend. Never condescending. Never "So basically."

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
