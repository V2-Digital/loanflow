import Link from "next/link";
import { getCurrentUser, can } from "@/lib/auth";
import { listLoansForUser, listMyOpenTasks } from "@/lib/repo";
import { ROLE_LABEL } from "@/lib/types";
import { money, date } from "@/lib/format";
import { StageBadge, StageBar } from "@/components/StageBar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const loans = listLoansForUser(user);
  const myTasks = listMyOpenTasks(user.id);
  const canCreate = can(user, "loan:create");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.role === "borrower" ? "My applications" : "Loan pipeline"}
          </h1>
          <p className="text-sm text-slate-500">
            {user.name} · {ROLE_LABEL[user.role]} ·{" "}
            {user.role === "manager"
              ? "viewing all loans"
              : user.role === "borrower"
                ? "your business loans"
                : "loans you're assigned to"}
          </p>
        </div>
        {canCreate && (
          <Link href="/loans/new" className="btn-primary">
            + New loan
          </Link>
        )}
      </div>

      {myTasks.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            My open tasks ({myTasks.length})
          </h2>
          <ul className="divide-y divide-slate-100">
            {myTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/loans/${t.loanId}`} className="hover:text-brand-700">
                  <span className="font-medium">{t.title}</span>
                  <span className="text-slate-400"> · {t.businessName}</span>
                </Link>
                <span className="text-xs text-slate-500">Due {date(t.dueDate)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        {loans.length === 0 && (
          <div className="card p-8 text-center text-sm text-slate-500">
            No loans yet.{" "}
            {canCreate ? (
              <Link href="/loans/new" className="text-brand-700 underline">
                Create the first one
              </Link>
            ) : (
              "Your loan officer will add you to a loan."
            )}
          </div>
        )}

        {loans.map((l) => (
          <Link
            key={l.id}
            href={`/loans/${l.id}`}
            className="card block p-4 transition hover:border-brand-300 hover:shadow"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{l.businessName}</h3>
                  <StageBadge stage={l.stage} />
                  {l.decision && (
                    <span className="chip bg-slate-100 capitalize text-slate-600">
                      {l.decision}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{l.purpose}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{money(l.amount)}</div>
                <div className="text-xs text-slate-400">{l.termMonths} mo term</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <StageBar stage={l.stage} />
              <div className="flex gap-2 text-xs">
                {l.openDocs > 0 && (
                  <span className="chip bg-amber-100 text-amber-800">
                    {l.openDocs} doc{l.openDocs > 1 ? "s" : ""} pending
                  </span>
                )}
                {l.openTasks > 0 && (
                  <span className="chip bg-slate-100 text-slate-700">
                    {l.openTasks} open task{l.openTasks > 1 ? "s" : ""}
                  </span>
                )}
                {l.myTasks > 0 && (
                  <span className="chip bg-brand-50 text-brand-700">
                    {l.myTasks} assigned to me
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
