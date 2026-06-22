import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTIFACTS, getArtifact, stripMarkdown } from "../artifacts";

type Params = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return ARTIFACTS.map((artifact) => ({ slug: artifact.slug }));
}

export function generateMetadata({ params }: Params) {
  const artifact = getArtifact(params.slug);
  return {
    title: artifact ? `${artifact.title} - AI-DLC Artifacts` : "AI-DLC Artifact",
  };
}

export default function ArtifactDetailPage({ params }: Params) {
  const artifact = getArtifact(params.slug);
  if (!artifact) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/aidlc" className="btn-ghost">
          Back to artifacts
        </Link>
        <span className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-500">
          aidlc-docs/{artifact.file}
        </span>
      </div>

      <section className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {artifact.phase}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {artifact.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {artifact.summary}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-slate-900">Sections</h2>
            <div className="mt-3 grid gap-2 text-sm">
              {artifact.sections.map((section) => (
                <a
                  key={section}
                  href={`#${slugify(section)}`}
                  className="text-slate-600 hover:text-brand-700"
                >
                  {section}
                </a>
              ))}
            </div>
          </div>
          <div className="card grid grid-cols-3 gap-2 p-3 text-center">
            <SmallMetric label="Done" value={artifact.stats.done} />
            <SmallMetric label="Skip" value={artifact.stats.skipped} />
            <SmallMetric label="Req" value={artifact.stats.requirements} />
          </div>
        </aside>

        <article className="card overflow-hidden p-5">
          <MarkdownDocument markdown={artifact.markdown} />
        </article>
      </div>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-lg font-semibold text-slate-950">{value}</div>
      <div className="text-[0.65rem] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}

function MarkdownDocument({ markdown }: { markdown: string }) {
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
          return (
            <ul key={`${block.type}-${index}`} className="space-y-2 text-sm text-slate-600">
              {block.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span className="leading-6">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
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
  | { type: "list"; items: string[] }
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

    if (line.startsWith("- ")) {
      const items = [];
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(lines[index].replace(/^- /, ""));
        index += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith("#") &&
      !lines[index].startsWith("- ") &&
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
