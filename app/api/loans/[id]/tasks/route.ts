import { getCurrentUser, can } from "@/lib/auth";
import { createTask, getLoan, isMember } from "@/lib/repo";
import { ok, bad, forbidden, notFound, requireString, optInt, ValidationError } from "@/lib/http";

export const dynamic = "force-dynamic";

// POST { title, description?, assigneeId?, dueDate? }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const loan = getLoan(id);
  if (!loan) return notFound();

  const user = getCurrentUser();
  if (!can(user, "task:create", { loan, isMember: isMember(id, user.id) })) {
    return forbidden();
  }

  try {
    const b = await req.json();
    const task = createTask(
      id,
      {
        title: requireString(b.title, "title"),
        description: typeof b.description === "string" ? b.description : "",
        assigneeId: optInt(b.assigneeId),
        dueDate: typeof b.dueDate === "string" && b.dueDate ? b.dueDate : null,
      },
      user
    );
    return ok(task, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) return bad(e.message);
    return bad("Could not create task");
  }
}
