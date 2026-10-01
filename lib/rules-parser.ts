/**
 * Zet de vrije reglementtekst om in secties, zodat de reglementpagina een
 * index kan tonen. Een sectiekop is een regel van de vorm `── Titel ──`.
 * Genummerde regels (`1. ...`) worden samengevoegd tot één lijst.
 */

export interface RulesBlock {
  type: "paragraph" | "list";
  text?: string;
  items?: string[];
}

export interface RulesSection {
  id: string;
  title: string | null;
  blocks: RulesBlock[];
}

const HEADING = /^\s*[─—-]{2,}\s*(.+?)\s*[─—-]{2,}\s*$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toBlocks(lines: string[]): RulesBlock[] {
  const blocks: RulesBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "list", items: list });
      list = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const numbered = NUMBERED.exec(trimmed);
    if (numbered) {
      flushParagraph();
      list.push(numbered[1]);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

export function parseRules(description: string): RulesSection[] {
  const sections: RulesSection[] = [];
  let title: string | null = null;
  let buffer: string[] = [];
  const used = new Set<string>();

  const flush = () => {
    const blocks = toBlocks(buffer);
    buffer = [];
    if (!blocks.length) return;

    const base = title ? slugify(title) : `deel-${sections.length + 1}`;
    let id = base || `deel-${sections.length + 1}`;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);

    sections.push({ id, title, blocks });
  };

  for (const line of description.split(/\r?\n/)) {
    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      title = heading[1];
      continue;
    }
    buffer.push(line);
  }
  flush();

  return sections;
}
