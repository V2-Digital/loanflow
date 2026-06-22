import { listUsers } from "@/lib/repo";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(listUsers());
}
