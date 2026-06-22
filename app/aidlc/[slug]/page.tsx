import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownDocument, slugify } from "@/components/MarkdownDocument";
import { ARTIFACTS, getArtifact } from "../artifacts";

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return ARTIFACTS.map((artifact) => ({ slug: artifact.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const artifact = getArtifact(slug);
  return {
    title: artifact ? `${artifact.title} - AI-DLC Artifacts` : "AI-DLC Artifact",
  };
}

export default async function ArtifactDetailPage({ params }: Params) {
  const { slug } = await params;
  const artifact = getArtifact(slug);
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
