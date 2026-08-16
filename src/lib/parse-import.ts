import type { Block } from "@/lib/types";

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr|br|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<h1[^>]*>/gi, "# ")
    .replace(/<h2[^>]*>/gi, "## ")
    .replace(/<h3[^>]*>/gi, "### ")
    .replace(/<blockquote[^>]*>/gi, "> ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseImportedText(raw: string): { title: string; blocks: Block[] } {
  const looksHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  const text = looksHtml ? stripTags(raw) : raw.replace(/\r\n/g, "\n").trim();
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let pendingList: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (pendingList && pendingList.items.length > 0) {
      blocks.push({
        type: "list",
        ordered: pendingList.ordered,
        items: pendingList.items,
      });
    }
    pendingList = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push({ type: "h3", text: trimmed.slice(4) });
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push({ type: "h2", text: trimmed.slice(3) });
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      blocks.push({ type: "h1", text: trimmed.slice(2) });
      continue;
    }
    if (trimmed.startsWith("> ")) {
      flushList();
      blocks.push({ type: "quote", text: trimmed.slice(2) });
      continue;
    }
    const ul = trimmed.match(/^[-*•]\s+(.+)/);
    if (ul) {
      if (!pendingList || pendingList.ordered) {
        flushList();
        pendingList = { ordered: false, items: [] };
      }
      pendingList.items.push(ul[1]);
      continue;
    }
    const ol = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (ol) {
      if (!pendingList || !pendingList.ordered) {
        flushList();
        pendingList = { ordered: true, items: [] };
      }
      pendingList.items.push(ol[1]);
      continue;
    }
    flushList();
    blocks.push({ type: "p", text: trimmed });
  }
  flushList();

  const titleBlock = blocks.find((b) => b.type === "h1" || b.type === "h2");
  const title =
    titleBlock && "text" in titleBlock
      ? titleBlock.text
      : blocks.find((b) => b.type === "p" && "text" in b)
        ? (blocks.find((b) => b.type === "p") as { text: string }).text.slice(0, 72)
        : "Untitled passage";

  return { title, blocks: blocks.length > 0 ? blocks : [{ type: "p", text: text }] };
}

export function flattenBlocks(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "list") return b.items.join(" ");
      if (b.type === "code") return b.text;
      if (b.type === "table") {
        return [...b.headers, ...b.rows.flat()].join(" ");
      }
      return b.text;
    })
    .join("\n");
}
