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
  terms: z.array(termSchema).min(1).max(16),
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

Read the passage. Pick 6–12 jargon terms a thoughtful non-expert would stumble on. Prefer terms that actually appear in the text.

For each term:
- gloss: one sentence, ≤ 160 characters, concrete, a little playful. No dictionary throat-clearing.
- explanation: 2–4 sentences, accurate, plain words first.
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

Voice: a good teacher. Not cute. Not Wikipedia. Never condescending. Never start with "So basically."

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
