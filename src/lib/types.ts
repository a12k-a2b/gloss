import type { OriginSkin } from "@/lib/origin-skin";

export type Block =
  | { type: "h1" | "h2" | "h3" | "p" | "quote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "note"; kind: "note" | "tip" | "warning"; text: string };

export type DiagramNode = {
  id: string;
  label: string;
  kind?: "box" | "cloud" | "actor" | "note";
};

export type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
};

export type DiagramLane = {
  label?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

export type DiagramSpec = {
  title: string;
  caption: string;
  lanes: DiagramLane[];
};

export type Term = {
  id: string;
  term: string;
  aliases: string[];
  gloss: string;
  explanation: string;
  analogy: string;
  context: string;
  excerpt: string;
  related: string[];
  diagram: DiagramSpec;
  source?: "auto" | "asked";
};

export type Article = {
  id: string;
  title: string;
  dek: string;
  source: string;
  minutes: number;
  custom?: boolean;
  url?: string;
  addedAt?: number;
  field?: string;
  origin?: OriginSkin;
  blocks: Block[];
  terms: Term[];
};

export type ThemeName = "paper" | "ink";
export type ContrastName = "standard" | "high";
export type TypeScale = 0 | 1 | 2 | 3;
export type MobilePane = "read" | "words";
export type AskKind = "word" | "phrase" | "sentence" | "paragraph";
