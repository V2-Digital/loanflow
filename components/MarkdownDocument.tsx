export function MarkdownDocument({ markdown }: { markdown: string }) {
  const blocks = toBlocks(markdown);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const id = slugify(stripMarkdown(block.text));
          const Tag = `h${Math.min(block.level, 3)}` as "h1" | "h2" | "h3";
          return (
            <Tag
              key={`${block.type}-${index}`}
              id={id}
              className={
                block.level === 1
                  ? "text-2xl font-semibold tracking-tight text-slate-950"
                  : "scroll-mt-24 pt-2 text-lg font-semibold text-slate-900"
              }
            >
              {renderInline(block.text)}
            </Tag>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={`${block.type}-${index}`} className="text-sm leading-6 text-slate-600">
              {renderInline(block.text)}
            </p>
          );
        }

        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag
              key={`${block.type}-${index}`}
              className={
                block.ordered
                  ? "list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600"
                  : "space-y-2 text-sm text-slate-600"
              }
            >
              {block.items.map((item) =>
                block.ordered ? (
                  <li key={item}>{renderInline(item)}</li>
                ) : (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                    <span className="leading-6">{renderInline(item)}</span>
                  </li>
                ),
              )}
            </Tag>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={`${block.type}-${index}`}
              className="border-l-4 border-brand-200 bg-brand-50 px-4 py-3 text-sm leading-6 text-slate-700"
            >
              {renderInline(block.text)}
            </blockquote>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={`${block.type}-${index}`}
              className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100"
            >
              <code>{block.text}</code>
            </pre>
          );
        }

        if (block.type === "table") {
          return <MarkdownTable key={`${block.type}-${index}`} rows={block.rows} />;
        }

        return <hr key={`${block.type}-${index}`} className="border-slate-200" />;
      })}
    </div>
  );
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered: boolean }
  | { type: "quote"; text: string }
  | { type: "code"; text: string }
  | { type: "table"; rows: string[][] }
  | { type: "rule" };

function toBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ type: "code", text: code.join("\n") });
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    if (line.trim() === "---") {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    if (line.startsWith("|")) {
      const rows = [];
      while (index < lines.length && lines[index].startsWith("|")) {
        const cells = lines[index]
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim());
        const isDivider = cells.every((cell) => /^:?-{2,}:?$/.test(cell));
        if (!isDivider) rows.push(cells);
        index += 1;
      }
      blocks.push({ type: "table", rows });
      continue;
    }

    if (line.startsWith(">")) {
      const quote = [];
      while (index < lines.length && lines[index].startsWith(">")) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    const listMatch = line.match(/^(-|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]);
      const items = [];
      while (index < lines.length) {
        const current = lines[index];
        const currentMatch = current.match(/^(-|\d+\.)\s+(.+)$/);
        if (currentMatch) {
          const currentOrdered = /\d+\./.test(currentMatch[1]);
          if (currentOrdered !== ordered) break;
          items.push(currentMatch[2]);
          index += 1;
          continue;
        }

        if (current.startsWith("  ") && current.trim() && items.length > 0) {
          items[items.length - 1] = `${items[items.length - 1]} ${current.trim()}`;
          index += 1;
          continue;
        }

        break;
      }
      blocks.push({ type: "list", items, ordered });
      continue;
    }

    if (/^\s+\S/.test(line) && blocks.length > 0) {
      const last = blocks[blocks.length - 1];
      if (last.type === "paragraph") {
        last.text = `${last.text} ${line.trim()}`;
        index += 1;
        continue;
      }
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith("#") &&
      !/^(-|\d+\.)\s+/.test(lines[index]) &&
      !lines[index].startsWith(">") &&
      !lines[index].startsWith("|") &&
      !lines[index].startsWith("```") &&
      lines[index].trim() !== "---"
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function MarkdownTable({ rows }: { rows: string[][] }) {
  const [head, ...body] = rows;
  if (!head) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((cell) => (
              <th key={cell} className="px-3 py-2">
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2 text-slate-600">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(text: string) {
  const clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const parts = clean.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-slate-800">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function stripMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[✅⏭️✔]/g, "")
    .trim();
}
