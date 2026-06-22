import fs from "node:fs";
import path from "node:path";

export type ArtifactDefinition = {
  slug: string;
  phase: "Overview" | "Inception" | "Construction";
  file: string;
  summary: string;
};

export type Artifact = ArtifactDefinition & {
  title: string;
  markdown: string;
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

export const PHASES: Artifact["phase"][] = ["Overview", "Inception", "Construction"];

export function stripMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[✅⏭️✔]/g, "")
    .trim();
}

export function readArtifact(definition: ArtifactDefinition): Artifact {
  const markdown = fs.readFileSync(
    path.join(process.cwd(), "aidlc-docs", definition.file),
    "utf8",
  );
  const title = stripMarkdown(markdown.match(/^#\s+(.+)$/m)?.[1] ?? definition.slug);
  const sections = [...markdown.matchAll(/^##\s+(.+)$/gm)]
    .map((match) => stripMarkdown(match[1]))
    .slice(0, 6);

  return {
    ...definition,
    title,
    markdown,
    sections,
    stats: {
      done: (markdown.match(/✅|✔/g) ?? []).length,
      skipped: (markdown.match(/⏭️|Skipped?/gi) ?? []).length,
      requirements: (markdown.match(/\bFR-[A-Z]\d|\bNFR-\d/g) ?? []).length,
    },
  };
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
