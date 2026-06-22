import { cookies } from "next/headers";
import { db } from "./db";
import type { User } from "./types";

// Re-export the pure policy so callers can keep importing from "@/lib/auth".
export { can, isStaff, type Action, type PolicyCtx } from "./policy";

export const SESSION_COOKIE = "lf_uid";

// --- Session (MOCK AUTH — reference only, not for production) ---------------
// The session is just a user id in a cookie. There are no passwords. A real
// build would replace this with a proper auth provider; the policy layer in
// lib/policy.ts is written so it can be reused unchanged.

export async function getCurrentUser(): Promise<User> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  const id = raw ? Number(raw) : NaN;
  if (Number.isFinite(id)) {
    const u = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
    if (u) return u;
  }
  const fallback = db
    .prepare("SELECT * FROM users WHERE role = 'loan_officer' ORDER BY id LIMIT 1")
    .get() as User | undefined;
  if (fallback) return fallback;
  return db.prepare("SELECT * FROM users ORDER BY id LIMIT 1").get() as User;
}
