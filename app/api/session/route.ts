import { getCurrentUser, SESSION_COOKIE } from "@/lib/auth";
import { getUser } from "@/lib/repo";
import { bad, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

// Current session user.
export async function GET() {
  return ok(getCurrentUser());
}

// Switch the active (mock) user. Body: { userId: number }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const userId = Number(body?.userId);
  if (!Number.isFinite(userId) || !getUser(userId)) {
    return bad("Unknown userId");
  }
  const res = ok({ ok: true, userId });
  res.cookies.set(SESSION_COOKIE, String(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
