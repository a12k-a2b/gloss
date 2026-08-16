import type { AskKind, Term } from "@/lib/types";

export type ExplainInput = {
  phrase: string;
  kind: AskKind;
  title: string;
  surrounding: string;
};

export type ExplainResult =
  | { ok: true; term: Term }
  | { ok: false; error: string };

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "ask"
  );
}

function sentenceAround(text: string, phrase: string): string {
  const i = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (i < 0) return text.replace(/\s+/g, " ").trim().slice(0, 280);
  let s = i;
  let e = i + phrase.length;
  while (s > 0 && !".!?".includes(text[s - 1] ?? "")) s -= 1;
  while (e < text.length && !".!?".includes(text[e - 1] ?? "")) e += 1;
  return text.slice(s, e).replace(/\s+/g, " ").trim();
}

export function localExplain(input: ExplainInput): Term {
  const sentence = sentenceAround(input.surrounding || input.phrase, input.phrase);
  const label =
    input.kind === "sentence"
      ? "This sentence"
      : input.kind === "paragraph"
        ? "This paragraph"
        : input.phrase;

  if (input.kind === "sentence" || input.kind === "paragraph") {
    return {
      id: `ask-${slug(input.phrase)}`,
      term: label,
      aliases: [],
      gloss: "The point of this stretch, in one breath.",
      explanation: `Denys is saying: ${sentence} Read it as a human sentence first; the proper nouns are just the tools he used to do that job.`,
      analogy:
        "Like overhearing one story at a dinner table. You do not need every name to know what the story is about.",
      context: `You pointed at this in “${input.title}.”`,
      excerpt: sentence.slice(0, 200),
      related: [],
      source: "asked",
      diagram: {
        title: label,
        caption: "You asked. The passage is the picture.",
        lanes: [
          {
            nodes: [
              { id: "you", label: "you asked", kind: "actor" },
              { id: "w", label: "this stretch", kind: "box" },
              { id: "here", label: "keep\nreading", kind: "note" },
            ],
            edges: [
              { from: "you", to: "w" },
              { from: "w", to: "here" },
            ],
          },
        ],
      },
    };
  }

  return {
    id: `ask-${slug(input.phrase)}`,
    term: label,
    aliases: [],
    gloss: `A word Denys is using in: “${sentence.slice(0, 90)}${sentence.length > 90 ? "…" : ""}”`,
    explanation: `“${input.phrase}” sits in this sentence: ${sentence} If it is a name, it is probably a tool, a company, or a piece of his setup. If it is an ordinary word, the sentence around it is doing the real work — that is the thing to understand.`,
    analogy:
      "Like circling a word in a letter and reading the whole sentence again before you reach for a dictionary.",
    context: `You pointed at this in “${input.title}.”`,
    excerpt: sentence.slice(0, 200),
    related: [],
    source: "asked",
    diagram: {
      title: label,
      caption: "The word, then the sentence it lives in.",
      lanes: [
        {
          nodes: [
            { id: "you", label: "you asked", kind: "actor" },
            { id: "w", label: label.slice(0, 28), kind: "box" },
            { id: "here", label: "in this\nsentence", kind: "note" },
          ],
          edges: [
            { from: "you", to: "w" },
            { from: "w", to: "here" },
          ],
        },
      ],
    },
  };
}
