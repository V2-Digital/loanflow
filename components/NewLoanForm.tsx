"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./api";
import { ROLE_LABEL, type User } from "@/lib/types";

export function NewLoanForm({
  isStaff,
  borrowers,
}: {
  isStaff: boolean;
  borrowers: User[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {
      businessName: fd.get("businessName"),
      amount: Number(fd.get("amount")),
      purpose: fd.get("purpose"),
      termMonths: Number(fd.get("termMonths")),
      contactName: fd.get("contactName"),
      contactEmail: fd.get("contactEmail"),
    };
    if (isStaff) payload.borrowerId = Number(fd.get("borrowerId"));
    try {
      const loan = await api<{ id: number }>("/api/loans", "POST", payload);
      router.push(`/loans/${loan.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-2xl space-y-4 p-6">
      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}

      <div>
        <label className="label">Business name</label>
        <input name="businessName" required className="input" placeholder="Acme Manufacturing LLC" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Requested amount (USD)</label>
          <input name="amount" type="number" min={1} required className="input" placeholder="250000" />
        </div>
        <div>
          <label className="label">Term (months)</label>
          <input name="termMonths" type="number" min={1} required className="input" placeholder="60" />
        </div>
      </div>

      <div>
        <label className="label">Purpose</label>
        <textarea name="purpose" required rows={3} className="input" placeholder="What the funds will be used for" />
      </div>

      {isStaff && (
        <div>
          <label className="label">Borrower (applicant)</label>
          <select name="borrowerId" required className="input" defaultValue="">
            <option value="" disabled>
              Select a borrower…
            </option>
            {borrowers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.orgName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Primary contact name</label>
          <input name="contactName" required className="input" placeholder="Jordan Reyes" />
        </div>
        <div>
          <label className="label">Contact email</label>
          <input name="contactEmail" type="email" required className="input" placeholder="jordan@acme.co" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Creating…" : "Create loan"}
        </button>
      </div>
    </form>
  );
}
