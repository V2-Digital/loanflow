import fs from "node:fs";
import path from "node:path";

export type ArtifactDefinition = {
  slug: string;
  phase: "Overview" | "Reverse Engineering" | "Inception" | "Construction" | "Visual Artifacts";
  file: string;
  summary: string;
  title?: string;
  contentType?: "markdown" | "html" | "image" | "code";
  publicPath?: string;
};

export type Artifact = ArtifactDefinition & {
  title: string;
  content: string;
  contentType: "markdown" | "html" | "image" | "code";
  sections: string[];
  stats: {
    done: number;
    skipped: number;
    requirements: number;
  };
};

export const ARTIFACTS = [
  {
    slug: "state",
    phase: "Overview",
    file: "aidlc-state.md",
    summary: "Project intent, stage progress, extension configuration, and key decisions.",
  },
  {
    slug: "audit",
    phase: "Overview",
    file: "audit.md",
    summary: "A concise audit trail of the AI-DLC workflow from kickoff through construction.",
  },
  {
    slug: "ai-dlc-lifecycle",
    phase: "Visual Artifacts",
    file: "ai-dlc-lifecycle.html",
    title: "AI-DLC Lifecycle Diagram",
    contentType: "html",
    summary:
      "Self-contained visual reference for the AI-DLC process, assistance levels, personas, and aidlc-docs structure.",
  },
  {
    slug: "loanflow-diagram",
    phase: "Visual Artifacts",
    file: "visual-artifacts/loanflow-diagram.dc.html",
    title: "LoanFlow Diagram",
    contentType: "html",
    summary: "Visual prototype of the LoanFlow business-loan lifecycle, stage ownership, and system relationships.",
  },
  {
    slug: "loanflow-dev-process",
    phase: "Visual Artifacts",
    file: "visual-artifacts/loanflow-dev-process.dc.html",
    title: "LoanFlow Dev Process",
    contentType: "html",
    summary: "Source visual prototype for the AI-DLC lifecycle and aidlc-docs repository structure.",
  },
  {
    slug: "org-scaling",
    phase: "Visual Artifacts",
    file: "visual-artifacts/org-scaling.dc.html",
    title: "Standard Org Scaling",
    contentType: "html",
    summary: "Visual prototype showing how squads, tribes, chapters, and guilds scale around LoanFlow.",
  },
  {
    slug: "persona-absorption",
    phase: "Visual Artifacts",
    file: "visual-artifacts/persona-absorption.dc.html",
    title: "Persona Absorption",
    contentType: "html",
    summary: "Animated prototype showing squad work shifting across AI assistance levels.",
  },
  {
    slug: "persona-absorption-screenshot-01",
    phase: "Visual Artifacts",
    file: "visual-artifacts/screenshots/01-absorb.png",
    publicPath: "/aidlc-artifacts/screenshots/01-absorb.png",
    title: "Persona Absorption Screenshot 01",
    contentType: "image",
    summary: "Screenshot artifact from the persona absorption prototype.",
  },
  {
    slug: "persona-absorption-screenshot-02",
    phase: "Visual Artifacts",
    file: "visual-artifacts/screenshots/02-absorb.png",
    publicPath: "/aidlc-artifacts/screenshots/02-absorb.png",
    title: "Persona Absorption Screenshot 02",
    contentType: "image",
    summary: "Second screenshot artifact from the persona absorption prototype.",
  },
  {
    slug: "loanflow-repository-diagram-readme",
    phase: "Visual Artifacts",
    file: "visual-artifacts/loanflow-repository-diagram-readme.md",
    title: "LoanFlow Repository Diagram README",
    summary: "Claude Design handoff README describing the source artifact bundle.",
  },
  {
    slug: "loanflow-repository-diagram-runtime",
    phase: "Visual Artifacts",
    file: "visual-artifacts/support.js",
    title: "LoanFlow Repository Diagram Runtime",
    contentType: "code",
    summary: "Shared runtime used by the exported Claude Design .dc.html prototype artifacts.",
  },
  {
    slug: "feature-traceability-loop",
    phase: "Reverse Engineering",
    file: "reverse-engineering/feature-traceability-loop.md",
    summary:
      "Agentic loop for code-derived user stories, the canonical feature tracker, story testing, fixes, and retesting.",
  },
  {
    slug: "requirements",
    phase: "Inception",
    file: "inception/requirements/requirements.md",
    summary: "Problem statement, personas, functional requirements, NFRs, and acceptance criteria.",
  },
  {
    slug: "workflow-plan",
    phase: "Inception",
    file: "inception/plans/workflow-plan.md",
    summary: "Selected AI-DLC stages, execution sequence, and build order.",
  },
  {
    slug: "application-design",
    phase: "Inception",
    file: "inception/application-design/application-design.md",
    summary: "Architecture, domain model, authorization matrix, module layout, and UI plan.",
  },
  {
    slug: "units-of-work",
    phase: "Inception",
    file: "inception/units/units-of-work.md",
    summary: "Four reviewable implementation units covering auth, pipeline, documents/tasks, and collaboration.",
  },
  {
    slug: "build-and-test",
    phase: "Construction",
    file: "construction/build-and-test/build-and-test-summary.md",
    summary: "Build commands, manual smoke plan, automated smoke script, and known limitations.",
  },
] as const satisfies readonly ArtifactDefinition[];

export const PHASES: Artifact["phase"][] = [
  "Overview",
  "Visual Artifacts",
  "Reverse Engineering",
  "Inception",
  "Construction",
];

export function stripMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[✅⏭️✔]/g, "")
    .trim();
}

export function readArtifact(definition: ArtifactDefinition): Artifact {
  const contentType =
    definition.contentType ??
    (definition.file.endsWith(".html")
      ? "html"
      : /\.(png|jpe?g|webp|gif|svg)$/i.test(definition.file)
        ? "image"
        : definition.file.endsWith(".js")
          ? "code"
          : "markdown");
  const filePath = path.join(process.cwd(), "aidlc-docs", definition.file);
  let content =
    contentType === "image" ? definition.publicPath ?? "" : fs.readFileSync(filePath, "utf8");
  if (contentType === "html") {
    content = inlineLocalScripts(content, path.dirname(filePath));
    content = addAgenticLevelHeading(content);
  }
  const title =
    definition.title ??
    stripMarkdown(
      contentType === "html"
        ? content.match(/<h1[^>]*>(.*?)<\/h1>/is)?.[1] ??
            content.match(/<title[^>]*>(.*?)<\/title>/is)?.[1] ??
            definition.slug
        : content.match(/^#\s+(.+)$/m)?.[1] ?? definition.slug,
    );
  const sections =
    contentType === "markdown"
      ? [...content.matchAll(/^##\s+(.+)$/gm)]
          .map((match) => stripMarkdown(match[1]))
          .slice(0, 6)
      : [];

  return {
    ...definition,
    title,
    content,
    contentType,
    sections,
    stats: {
      done: (content.match(/✅|✔/g) ?? []).length,
      skipped: (content.match(/⏭️|Skipped?/gi) ?? []).length,
      requirements: (content.match(/\bFR-[A-Z]\d|\bNFR-\d/g) ?? []).length,
    },
  };
}

function inlineLocalScripts(html: string, directory: string) {
  return html.replace(/<script\s+src=["']\.\/([^"']+)["']\s*><\/script>/gi, (_match, file) => {
    const script = fs.readFileSync(path.join(directory, file), "utf8");
    return `<script>\n${script}\n</script>`;
  });
}

function addAgenticLevelHeading(html: string) {
  if (html.includes(">Agentic Level<")) return html;

  const heading =
    `<div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #b08968; letter-spacing: 0.04em; margin-bottom: 14px;">Agentic Level</div>`;
  const grid =
    `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 40px;">`;
  const rawTarget = `  <!-- Legend -->\n  ${grid}`;

  if (html.includes(rawTarget)) {
    return html.replace(rawTarget, `  <!-- Legend -->\n  ${heading}\n  ${grid}`);
  }

  const escapedHeading = heading.replaceAll(`"`, `\\"`).replaceAll("</", "<\\u002F");
  const escapedGrid = grid.replaceAll(`"`, `\\"`);
  const escapedTarget = `  <!-- Legend -->\\n  ${escapedGrid}`;

  return html.replace(escapedTarget, `  <!-- Legend -->\\n  ${escapedHeading}\\n  ${escapedGrid}`);
}

export function listArtifacts() {
  return ARTIFACTS.map(readArtifact);
}

export function getArtifact(slug: string) {
  const definition = ARTIFACTS.find((artifact) => artifact.slug === slug);
  return definition ? readArtifact(definition) : null;
}

export function excerpt(file: string, heading: string) {
  const markdown = fs.readFileSync(path.join(process.cwd(), "aidlc-docs", file), "utf8");
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line === heading);
  if (start === -1) return [];

  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    const clean = stripMarkdown(line.replace(/^- /, ""));
    if (clean && !clean.startsWith("|") && !clean.startsWith("---")) body.push(clean);
    if (body.length === 4) break;
  }
  return body;
}
