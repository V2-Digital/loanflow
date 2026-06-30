import Link from "next/link";
import { PHASES, excerpt, listArtifacts } from "./artifacts";

export default function AidlcArtifactsPage() {
  const artifacts = listArtifacts();
  const requirements = excerpt("inception/requirements/requirements.md", "## 3. Functional Requirements");
  const buildSteps = excerpt(
    "construction/build-and-test/build-and-test-summary.md",
    "## Build instructions",
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-6 border-b border-slate-200 pb-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              AI-DLC artifact library
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              LoanFlow delivery trail
            </h1>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            A compact view of the reverse-engineering, planning, design,
            implementation, and validation artifacts that shaped this reference
            business-loan coordination app.
          </p>
          <div className="flex flex-wrap gap-2">
            {PHASES.map((phase) => (
              <a key={phase} href={`#${phaseId(phase)}`} className="btn-ghost">
                {phase}
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 self-end">
          <Metric label="Artifacts" value={artifacts.length} />
          <Metric
            label="Completed"
            value={artifacts.reduce((sum, artifact) => sum + artifact.stats.done, 0)}
          />
          <Metric
            label="Req refs"
            value={artifacts.reduce((sum, artifact) => sum + artifact.stats.requirements, 0)}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <BriefPanel title="Functional scope" items={requirements} />
        <BriefPanel title="Run and verify" items={buildSteps} />
      </section>

      {PHASES.map((phase) => {
        const phaseArtifacts = artifacts.filter((artifact) => artifact.phase === phase);
        return (
          <section key={phase} id={phaseId(phase)} className="space-y-3 scroll-mt-24">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{phase}</h2>
                <p className="text-sm text-slate-500">
                  {phaseArtifacts.length} artifact{phaseArtifacts.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {phaseArtifacts.map((artifact) => (
                <Link
                  key={artifact.slug}
                  href={`/aidlc/${artifact.slug}`}
                  className="card block p-4 transition hover:border-brand-300 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{artifact.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{artifact.summary}</p>
                    </div>
                    <span className="chip shrink-0 bg-brand-50 text-brand-700">
                      Open
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {artifact.stats.done > 0 && (
                      <span className="chip bg-emerald-50 text-emerald-700">
                        {artifact.stats.done} done marker{artifact.stats.done === 1 ? "" : "s"}
                      </span>
                    )}
                    {artifact.stats.requirements > 0 && (
                      <span className="chip bg-brand-50 text-brand-700">
                        {artifact.stats.requirements} requirement refs
                      </span>
                    )}
                    {artifact.stats.skipped > 0 && (
                      <span className="chip bg-amber-50 text-amber-700">
                        {artifact.stats.skipped} skip note{artifact.stats.skipped === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  {artifact.sections.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Sections
                      </p>
                      <ul className="grid gap-1 text-sm text-slate-600">
                        {artifact.sections.map((section) => (
                          <li key={section} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
                            <span>{section}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
                    aidlc-docs/{artifact.file}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function phaseId(phase: string) {
  return phase.toLowerCase().replace(/\s+/g, "-");
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}

function BriefPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="card p-4">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-5 text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
