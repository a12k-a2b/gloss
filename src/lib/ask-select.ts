export type AskKind = "word" | "phrase" | "sentence" | "paragraph";

export type AskToken = {
  index: number;
  text: string;
  isWord: boolean;
  start: number;
  end: number;
};

const SMALL = new Set(
  "a an the of to for via using with from in on at and or my your its our their this that these those as by into onto over under than then also just only not".split(
    " ",
  ),
);

export function tokenize(text: string): AskToken[] {
  const tokens: AskToken[] = [];
  const re = /(\s+)|(\S+)/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    tokens.push({
      index: i,
      text: m[0],
      isWord: !m[1],
      start: m.index,
      end: m.index + m[0].length,
    });
    i += 1;
  }
  return tokens;
}

export function tokensFromParts(
  parts: Array<{ type: string; value: string }>,
): { text: string; tokens: AskToken[] } {
  const text = parts.map((p) => p.value).join("");
  const tokens: AskToken[] = [];
  let pos = 0;
  let index = 0;
  for (const part of parts) {
    if (part.type === "term") {
      tokens.push({
        index,
        text: part.value,
        isWord: true,
        start: pos,
        end: pos + part.value.length,
      });
      index += 1;
      pos += part.value.length;
    } else {
      const slice = tokenize(part.value);
      for (const t of slice) {
        tokens.push({
          index,
          text: t.text,
          isWord: t.isWord,
          start: pos + t.start,
          end: pos + t.end,
        });
        index += 1;
      }
      pos += part.value.length;
    }
  }
  return { text, tokens };
}

export function kindFromTaps(taps: number): AskKind {
  if (taps >= 5) return "paragraph";
  if (taps === 4) return "sentence";
  if (taps === 3) return "phrase";
  return "word";
}

export function nextKind(kind: AskKind): AskKind | null {
  if (kind === "word") return "phrase";
  if (kind === "phrase") return "sentence";
  if (kind === "sentence") return "paragraph";
  return null;
}

export function kindLabel(kind: AskKind): string {
  if (kind === "word") return "this word";
  if (kind === "phrase") return "this phrase";
  if (kind === "sentence") return "this sentence";
  return "this paragraph";
}

export function growHint(kind: AskKind): string {
  const n = nextKind(kind);
  if (!n) return "That's the whole paragraph. Tap away to keep reading.";
  return `Tap again for ${kindLabel(n).replace("this ", "the ")}. Tap away to keep reading.`;
}

function isWordToken(t: AskToken): boolean {
  return t.isWord && /[\p{L}\p{N}]/u.test(t.text);
}

export function wordRange(tokens: AskToken[], i: number): [number, number] {
  if (tokens.length === 0) return [0, 0];
  let at = Math.max(0, Math.min(i, tokens.length - 1));
  if (!isWordToken(tokens[at])) {
    const right = tokens.findIndex((t, k) => k >= at && isWordToken(t));
    const left = [...tokens].reverse().find((t) => t.index <= at && isWordToken(t));
    if (right >= 0) at = right;
    else if (left) at = left.index;
  }
  return [at, at];
}

export function phraseRange(tokens: AskToken[], i: number): [number, number] {
  const [start0] = wordRange(tokens, i);
  let start = start0;
  let end = start0;
  const prevWords = tokens.slice(0, start).filter(isWordToken);
  const prev = prevWords[prevWords.length - 1];
  const LEFT = new Set("a an the of to for via using with from my your its our their".split(" "));
  if (prev) {
    const raw = prev.text.replace(/^[“"'([]+|[,.;:!?)"'\]]+$/g, "").toLowerCase();
    if (LEFT.has(raw) || /ing$/.test(raw)) {
      start = prev.index;
    }
  }
  let extra = 0;
  for (let k = end + 1; k < tokens.length && extra < 2; k++) {
    if (!isWordToken(tokens[k])) {
      if (/[.!?,;:]/.test(tokens[k].text)) break;
      continue;
    }
    const raw = tokens[k].text.replace(/^[“"'([]+|[,.;:!?)"'\]]+$/g, "").toLowerCase();
    if (raw === "and" || raw === "or" || raw === "but") break;
    if (/[.!?]/.test(tokens[k].text)) {
      end = k;
      break;
    }
    end = k;
    extra += 1;
  }
  return [start, end];
}

export function sentenceBounds(text: string, offset: number): [number, number] {
  const at = Math.max(0, Math.min(offset, Math.max(0, text.length - 1)));
  const breaks: number[] = [0];
  for (let i = 0; i < text.length - 1; i++) {
    const c = text[i];
    if (c !== "." && c !== "!" && c !== "?") continue;
    if (!/\s/.test(text[i + 1])) continue;
    const before = text.slice(Math.max(0, i - 5), i + 1);
    if (/\b(e\.g|i\.e|etc|vs|Mr|Ms|Dr|St|No)\.$/i.test(before)) continue;
    if (/\b[A-Za-z]\.$/.test(before)) continue;
    breaks.push(i + 1);
  }
  breaks.push(text.length);
  for (let b = 0; b < breaks.length - 1; b++) {
    if (at >= breaks[b] && at < breaks[b + 1]) {
      let s = breaks[b];
      let e = breaks[b + 1];
      while (s < e && /\s/.test(text[s])) s += 1;
      return [s, e];
    }
  }
  return [0, text.length];
}

export function coveringRange(
  tokens: AskToken[],
  charStart: number,
  charEnd: number,
): [number, number] {
  if (tokens.length === 0) return [0, 0];
  let start = tokens.findIndex((t) => t.end > charStart && t.isWord);
  if (start < 0) start = tokens.findIndex((t) => t.isWord);
  if (start < 0) return [0, tokens.length - 1];
  let end = start;
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i].start < charEnd) end = i;
  }
  return [start, end];
}

export function rangeForKind(
  tokens: AskToken[],
  fullText: string,
  tokenIndex: number,
  kind: AskKind,
): [number, number] {
  if (kind === "word") return wordRange(tokens, tokenIndex);
  if (kind === "phrase") return phraseRange(tokens, tokenIndex);
  const [w] = wordRange(tokens, tokenIndex);
  const origin = tokens[w] ?? tokens[tokenIndex] ?? tokens[0];
  if (kind === "sentence") {
    const [s, e] = sentenceBounds(fullText, origin?.start ?? 0);
    return coveringRange(tokens, s, e);
  }
  return coveringRange(tokens, 0, fullText.length);
}

export function textForRange(tokens: AskToken[], start: number, end: number): string {
  return tokens
    .slice(start, end + 1)
    .map((t) => t.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function padContains(
  rects: Array<{ left: number; top: number; right: number; bottom: number }>,
  x: number,
  y: number,
  pad = 56,
): boolean {
  return rects.some(
    (r) => x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad,
  );
}
