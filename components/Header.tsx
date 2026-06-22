"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "./api";
import { Avatar } from "./Avatar";
import { ROLE_LABEL, type User } from "@/lib/types";

export function Header({ users, current }: { users: User[]; current: User }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function switchUser(id: number) {
    if (id === current.id) return;
    setBusy(true);
    try {
      await api("/api/session", "POST", { userId: id });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 font-bold text-white">
              LF
            </span>
            <span className="text-lg font-semibold tracking-tight">LoanFlow</span>
            <span className="hidden text-sm text-slate-400 sm:inline">
              · Business Loan Coordination
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <Link href="/" className="btn-ghost py-1.5">
              Pipeline
            </Link>
            <Link href="/aidlc" className="btn-ghost py-1.5">
              AI-DLC artifacts
            </Link>
            <Link href="/readme" className="btn-ghost py-1.5">
              README
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <label className="hidden text-xs font-medium text-slate-500 sm:block">
            Viewing as
          </label>
          <div className="flex items-center gap-2">
            <Avatar name={current.name} id={current.id} />
            <select
              aria-label="Switch user"
              className="input max-w-[15rem] py-1.5"
              value={current.id}
              disabled={busy}
              onChange={(e) => switchUser(Number(e.target.value))}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {ROLE_LABEL[u.role]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
