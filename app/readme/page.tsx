import fs from "node:fs";
import path from "node:path";
import { MarkdownDocument } from "@/components/MarkdownDocument";

export const metadata = {
  title: "README - LoanFlow",
};

export default function ReadmePage() {
  const markdown = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8");

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Demo guide
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          README
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          The project README rendered inside LoanFlow for demos, walkthroughs, and
          explaining how AI-DLC shaped this reference implementation.
        </p>
      </section>

      <article className="card overflow-hidden p-5">
        <MarkdownDocument markdown={markdown} />
      </article>
    </div>
  );
}
