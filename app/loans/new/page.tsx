import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, can, isStaff } from "@/lib/auth";
import { listUsers } from "@/lib/repo";
import { NewLoanForm } from "@/components/NewLoanForm";

export const dynamic = "force-dynamic";

export default async function NewLoanPage() {
  const user = await getCurrentUser();
  if (!can(user, "loan:create")) redirect("/");
  const borrowers = listUsers().filter((u) => u.role === "borrower");

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm text-slate-500 hover:text-brand-700">
        ← Back to pipeline
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New business loan</h1>
      <p className="text-sm text-slate-500">
        {isStaff(user.role)
          ? "Create a loan record on behalf of a borrower."
          : "Start a new loan application for your business."}
      </p>
      <NewLoanForm isStaff={isStaff(user.role)} borrowers={borrowers} />
    </div>
  );
}
