import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/lib/repo";

export const metadata: Metadata = {
  title: "LoanFlow — Business Loan Coordination",
  description: "AI-DLC reference implementation for a bank loan coordination workspace",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  const users = listUsers();
  return (
    <html lang="en">
      <body>
        <Header users={users} current={current} />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
          LoanFlow · AI-DLC reference implementation · Mock auth — not for production
        </footer>
      </body>
    </html>
  );
}
