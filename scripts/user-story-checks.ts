/**
 * HTTP/API checks mapped to feature-status-tracker.csv IDs.
 *
 * Run against a live dev server after `npm run seed`:
 *   npm run story:check
 */

import { db } from "../lib/db";

type Result = {
  id: string;
  name: string;
  status: "pass" | "fail";
  detail: string;
};

const BASE_URL = process.env.LOANFLOW_BASE_URL ?? "http://localhost:3000";
const results: Result[] = [];

class Client {
  cookie = "";

  async request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (this.cookie) headers.set("cookie", this.cookie);
    if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, redirect: "manual" });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0];
    return res;
  }

  async json(path: string, init: RequestInit = {}) {
    const res = await this.request(path, init);
    const body = await res.json().catch(() => null);
    return { res, body };
  }

  async as(userId: number) {
    const { res } = await this.json("/api/session", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error(`Could not switch to user ${userId}: ${res.status}`);
    return this;
  }
}

function record(id: string, name: string, condition: boolean, detail: string) {
  results.push({ id, name, status: condition ? "pass" : "fail", detail });
}

async function text(client: Client, path: string) {
  const res = await client.request(path);
  return { res, body: await res.text() };
}

async function postJson(client: Client, path: string, body: unknown) {
  return client.json(path, { method: "POST", body: JSON.stringify(body) });
}

async function patchJson(client: Client, path: string, body: unknown) {
  return client.json(path, { method: "PATCH", body: JSON.stringify(body) });
}

async function main() {
  const officer = await new Client().as(1);
  const analyst = await new Client().as(2);
  const underwriter = await new Client().as(3);
  const manager = await new Client().as(4);
  const borrower1 = await new Client().as(5);
  const borrower2 = await new Client().as(6);

  const home = await text(officer, "/");
  record(
    "LF-001",
    "Global nav",
    home.res.status === 200 &&
      home.body.includes('href="/"') &&
      home.body.includes('href="/aidlc"') &&
      home.body.includes('href="/feature-tracker"') &&
      home.body.includes('href="/readme"'),
    `GET / status ${home.res.status}; nav links present=${home.body.includes('href="/readme"')}`,
  );

  const session = await manager.json("/api/session");
  const badSession = await manager.json("/api/session", {
    method: "POST",
    body: JSON.stringify({ userId: 99999 }),
  });
  record(
    "LF-002",
    "Persona switcher/session API",
    session.res.status === 200 && session.body?.id === 4,
    `GET /api/session returned ${session.res.status} id=${session.body?.id}`,
  );
  record(
    "LF-037",
    "Session API validation",
    session.res.status === 200 && badSession.res.status === 400,
    `GET session ${session.res.status}; bad POST ${badSession.res.status}`,
  );

  const seededLoans = await manager.json("/api/loans");
  record(
    "LF-044",
    "Seed script baseline",
    Array.isArray(seededLoans.body) && seededLoans.body.length === 2,
    `Manager sees ${seededLoans.body?.length ?? "n/a"} seeded loans before mutations.`,
  );

  const dashboards = await Promise.all([
    text(officer, "/"),
    text(analyst, "/"),
    text(underwriter, "/"),
    text(manager, "/"),
    text(borrower1, "/"),
    text(borrower2, "/"),
  ]);
  const [officerDash, analystDash, underwriterDash, managerDash, borrower1Dash, borrower2Dash] =
    dashboards.map((r) => r.body);
  const scopedLoanNames = await Promise.all(
    [officer, analyst, underwriter, manager, borrower1, borrower2].map(async (client) => {
      const response = await client.json("/api/loans");
      return (response.body as Array<{ businessName: string }>).map((loan) => loan.businessName);
    }),
  );
  const [officerLoans, analystLoans, underwriterLoans, managerLoans, borrower1Loans, borrower2Loans] =
    scopedLoanNames;
  record(
    "LF-003",
    "Dashboard role copy",
    officerDash.includes("loans you&#x27;re assigned to") &&
      managerDash.includes("viewing all loans") &&
      borrower1Dash.includes("your business loans"),
    "Role-specific dashboard subtitles checked for officer, manager, borrower.",
  );
  record(
    "LF-004",
    "Role-scoped loan list",
    officerLoans.includes("Brightside Bakery LLC") &&
      officerLoans.includes("North Loop Robotics Inc") &&
      analystLoans.includes("Brightside Bakery LLC") &&
      !analystLoans.includes("North Loop Robotics Inc") &&
      underwriterLoans.includes("Brightside Bakery LLC") &&
      !underwriterLoans.includes("North Loop Robotics Inc") &&
      managerLoans.includes("Brightside Bakery LLC") &&
      managerLoans.includes("North Loop Robotics Inc") &&
      borrower1Loans.includes("Brightside Bakery LLC") &&
      !borrower1Loans.includes("North Loop Robotics Inc") &&
      borrower2Loans.includes("North Loop Robotics Inc") &&
      !borrower2Loans.includes("Brightside Bakery LLC"),
    `API loan visibility: ${JSON.stringify(scopedLoanNames)}`,
  );
  record(
    "LF-005",
    "My open tasks panel",
    officerDash.includes("My open tasks") && officerDash.includes("Schedule intro call"),
    "Officer dashboard includes seeded assigned open task.",
  );
  record(
    "LF-006",
    "Loan summary cards",
    officerDash.includes("Submitted") &&
      officerDash.includes("Credit Review") &&
      officerDash.includes("$750,000") &&
      officerDash.includes("doc") &&
      officerDash.includes("open task"),
    "Loan card stage, amount, docs, and tasks markers found.",
  );
  const emptyUser = db
    .prepare("INSERT INTO users (name,email,role,orgName) VALUES (?,?,?,?)")
    .run("Empty Borrower", "empty-borrower@example.test", "borrower", "No Loan LLC");
  const emptyBorrower = await new Client().as(Number(emptyUser.lastInsertRowid));
  const emptyDash = await text(emptyBorrower, "/");
  record(
    "LF-007",
    "Dashboard empty loan state",
    emptyDash.body.includes("No loans yet") && emptyDash.body.includes("Create the first one"),
    `Empty borrower dashboard status ${emptyDash.res.status}`,
  );

  const borrowerCreate = await postJson(borrower1, "/api/loans", {
    businessName: "Borrower Created Co",
    amount: 111000,
    purpose: "Borrower self-service test",
    termMonths: 24,
    contactName: "Jordan Reyes",
    contactEmail: "jordan@brightside.co",
  });
  record(
    "LF-008",
    "Borrower creates own loan",
    borrowerCreate.res.status === 201 && borrowerCreate.body?.borrowerId === 5,
    `POST /api/loans borrower status ${borrowerCreate.res.status}; borrowerId=${borrowerCreate.body?.borrowerId}`,
  );

  const staffCreate = await postJson(officer, "/api/loans", {
    businessName: "Staff Created Co",
    amount: 222000,
    purpose: "Staff-created test",
    termMonths: 36,
    contactName: "Alex Kim",
    contactEmail: "alex@northloop.io",
    borrowerId: 6,
  });
  const staffLoanId = staffCreate.body?.id as number;
  record(
    "LF-009",
    "Staff creates loan for borrower",
    staffCreate.res.status === 201 && staffCreate.body?.borrowerId === 6,
    `POST /api/loans officer status ${staffCreate.res.status}; id=${staffLoanId}`,
  );
  const emptyDocDetail = await officer.json(`/api/loans/${staffLoanId}`);
  record(
    "LF-025",
    "Document empty aggregate",
    emptyDocDetail.res.status === 200 && emptyDocDetail.body?.documents?.length === 0,
    `New staff-created loan document count ${emptyDocDetail.body?.documents?.length ?? "n/a"}`,
  );

  const analystCreate = await postJson(analyst, "/api/loans", {
    businessName: "Blocked Analyst Co",
    amount: 1,
    purpose: "Should fail",
    termMonths: 1,
    contactName: "No",
    contactEmail: "no@example.com",
    borrowerId: 5,
  });
  const analystNewPage = await text(analyst, "/loans/new");
  record(
    "LF-010",
    "Create loan authorization",
    analystCreate.res.status === 403 && [307, 308].includes(analystNewPage.res.status),
    `Analyst POST status ${analystCreate.res.status}; /loans/new status ${analystNewPage.res.status}`,
  );

  const borrower2Loan1Api = await borrower2.json("/api/loans/1");
  const borrower2Loan1Page = await text(borrower2, "/loans/1");
  record(
    "LF-011",
    "Loan access control",
    borrower2Loan1Api.res.status === 403 && borrower2Loan1Page.body.includes("don't have access"),
    `Borrower2 GET /api/loans/1 ${borrower2Loan1Api.res.status}; access card=${borrower2Loan1Page.body.includes("don't have access")}`,
  );

  const loan1Page = await text(officer, "/loans/1");
  record(
    "LF-012",
    "Loan header/details/stage bar",
    loan1Page.res.status === 200 &&
      loan1Page.body.includes("Brightside Bakery") &&
      loan1Page.body.includes("$250,000") &&
      loan1Page.body.includes("Credit Review"),
    `GET /loans/1 status ${loan1Page.res.status}`,
  );

  const jump = await postJson(officer, `/api/loans/${staffLoanId}/stage`, { toStage: "underwriting" });
  record(
    "LF-015",
    "Reject non-adjacent stage jumps",
    jump.res.status === 400 && /adjacent/.test(jump.body?.error ?? ""),
    `Non-adjacent stage status ${jump.res.status}; error=${jump.body?.error}`,
  );

  const toSubmitted = await postJson(officer, `/api/loans/${staffLoanId}/stage`, {
    toStage: "submitted",
    note: "story check",
  });
  record(
    "LF-013",
    "Advance to adjacent stage",
    toSubmitted.res.status === 200 && toSubmitted.body?.stage === "submitted",
    `Advance status ${toSubmitted.res.status}; stage=${toSubmitted.body?.stage}`,
  );
  const backToDraft = await postJson(officer, `/api/loans/${staffLoanId}/stage`, { toStage: "draft" });
  record(
    "LF-014",
    "Return to adjacent previous stage",
    backToDraft.res.status === 200 && backToDraft.body?.stage === "draft",
    `Return status ${backToDraft.res.status}; stage=${backToDraft.body?.stage}`,
  );

  for (const stage of ["submitted", "document_collection", "credit_review", "underwriting", "decision"]) {
    await postJson(officer, `/api/loans/${staffLoanId}/stage`, { toStage: stage });
  }
  const officerDecision = await postJson(officer, `/api/loans/${staffLoanId}/stage`, {
    toStage: "closed",
    decision: "approved",
  });
  record(
    "LF-016",
    "Decision stage non-manager restriction",
    officerDecision.res.status === 403,
    `Officer decision close status ${officerDecision.res.status}`,
  );
  const managerDecision = await postJson(manager, `/api/loans/${staffLoanId}/stage`, {
    toStage: "closed",
    decision: "approved",
    decisionNote: "story check approved",
  });
  record(
    "LF-017",
    "Manager records final decision",
    managerDecision.res.status === 200 &&
      managerDecision.body?.stage === "closed" &&
      managerDecision.body?.decision === "approved",
    `Manager decision status ${managerDecision.res.status}; stage=${managerDecision.body?.stage}; decision=${managerDecision.body?.decision}`,
  );
  const afterClosed = await postJson(manager, `/api/loans/${staffLoanId}/stage`, { toStage: "decision" });
  record(
    "LF-018",
    "Closed loan terminal state",
    afterClosed.res.status === 400 && /closed/.test(afterClosed.body?.error ?? ""),
    `After-closed change status ${afterClosed.res.status}; error=${afterClosed.body?.error}`,
  );
  const closedDetail = await manager.json(`/api/loans/${staffLoanId}`);
  record(
    "LF-019",
    "Stage history",
    closedDetail.res.status === 200 && closedDetail.body?.stageEvents?.length >= 8,
    `Stage events count ${closedDetail.body?.stageEvents?.length ?? "n/a"}`,
  );

  const docReq = await postJson(officer, "/api/loans/1/documents", {
    name: "Story Check Statement",
    docType: "Financial Statement",
  });
  const docId = docReq.body?.id as number;
  record(
    "LF-020",
    "Request document",
    docReq.res.status === 201 && docReq.body?.status === "requested",
    `Request doc status ${docReq.res.status}; docId=${docId}`,
  );
  const borrowerDocReq = await postJson(borrower1, "/api/loans/1/documents", {
    name: "Borrower Should Not Request",
    docType: "Other",
  });
  record(
    "LF-021",
    "Borrower cannot request document",
    borrowerDocReq.res.status === 403,
    `Borrower request doc status ${borrowerDocReq.res.status}`,
  );
  const uploadDoc = await patchJson(borrower1, `/api/documents/${docId}`, { status: "uploaded" });
  record(
    "LF-022",
    "Upload document",
    uploadDoc.res.status === 200 && uploadDoc.body?.status === "uploaded" && uploadDoc.body?.uploadedById === 5,
    `Upload doc status ${uploadDoc.res.status}; status=${uploadDoc.body?.status}`,
  );
  const approveDoc = await patchJson(analyst, `/api/documents/${docId}`, { status: "approved" });
  record(
    "LF-023",
    "Approve document",
    approveDoc.res.status === 200 && approveDoc.body?.status === "approved",
    `Approve doc status ${approveDoc.res.status}; status=${approveDoc.body?.status}`,
  );
  const rejectDocReq = await postJson(officer, "/api/loans/1/documents", {
    name: "Story Check Rejection",
    docType: "Other",
  });
  const rejectDocId = rejectDocReq.body?.id as number;
  await patchJson(borrower1, `/api/documents/${rejectDocId}`, { status: "uploaded" });
  const rejectDoc = await patchJson(underwriter, `/api/documents/${rejectDocId}`, { status: "rejected" });
  record(
    "LF-024",
    "Reject document",
    rejectDoc.res.status === 200 && rejectDoc.body?.status === "rejected",
    `Reject doc status ${rejectDoc.res.status}; status=${rejectDoc.body?.status}`,
  );

  const taskCreate = await postJson(officer, "/api/loans/1/tasks", {
    title: "Story Check Task",
    assigneeId: 5,
    dueDate: "2026-07-05",
  });
  const taskId = taskCreate.body?.id as number;
  record(
    "LF-026",
    "Create assigned task",
    taskCreate.res.status === 201 && taskCreate.body?.status === "todo" && taskCreate.body?.assigneeId === 5,
    `Create task status ${taskCreate.res.status}; taskId=${taskId}`,
  );
  const unassignedTask = await postJson(officer, "/api/loans/1/tasks", { title: "Story Check Unassigned" });
  record(
    "LF-027",
    "Create unassigned task",
    unassignedTask.res.status === 201 && unassignedTask.body?.assigneeId === null,
    `Create unassigned task status ${unassignedTask.res.status}; assignee=${unassignedTask.body?.assigneeId}`,
  );
  const taskMove = await patchJson(borrower1, `/api/tasks/${taskId}`, { status: "in_progress" });
  record(
    "LF-028",
    "Update task status",
    taskMove.res.status === 200 && taskMove.body?.status === "in_progress",
    `Borrower task move status ${taskMove.res.status}; status=${taskMove.body?.status}`,
  );
  const blockedTaskMove = await patchJson(borrower2, `/api/tasks/${taskId}`, { status: "done" });
  record(
    "LF-029",
    "Unauthorized task update blocked",
    blockedTaskMove.res.status === 403,
    `Borrower2 task move status ${blockedTaskMove.res.status}`,
  );
  const borrowerDashAfterTask = await text(borrower1, "/");
  record(
    "LF-030",
    "Task dashboard count and badges update",
    borrowerDashAfterTask.body.includes("Story Check Task"),
    "Borrower dashboard includes newly assigned non-done task.",
  );

  const teamPage = await text(officer, "/loans/1");
  record(
    "LF-031",
    "View loan team",
    teamPage.body.includes("Jordan Reyes") && teamPage.body.includes("Priya Nair"),
    `Loan page includes borrower/officer names=${teamPage.body.includes("Jordan Reyes")}/${teamPage.body.includes("Priya Nair")}`,
  );
  const memberAssign = await postJson(officer, "/api/loans/2/members", { userId: 3 });
  record(
    "LF-032",
    "Assign staff member",
    memberAssign.res.status === 200,
    `Assign underwriter to loan2 status ${memberAssign.res.status}`,
  );
  const borrowerAssign = await postJson(borrower2, "/api/loans/2/members", { userId: 2 });
  const assignBorrowerTarget = await postJson(officer, "/api/loans/2/members", { userId: 5 });
  record(
    "LF-033",
    "Team assignment authorization and filtering",
    borrowerAssign.res.status === 403 && assignBorrowerTarget.res.status === 400,
    `Borrower assign status ${borrowerAssign.res.status}; borrower target status ${assignBorrowerTarget.res.status}`,
  );

  const comment = await postJson(borrower1, "/api/loans/1/comments", { body: "Story check borrower comment" });
  record(
    "LF-034",
    "Post comment",
    comment.res.status === 201 && comment.body?.body === "Story check borrower comment",
    `Comment status ${comment.res.status}`,
  );
  const detailAfterComment = await officer.json("/api/loans/1");
  record(
    "LF-035",
    "Read comments",
    detailAfterComment.body?.comments?.some((c: { body: string }) => c.body === "Story check borrower comment"),
    `Comments count ${detailAfterComment.body?.comments?.length ?? "n/a"}`,
  );
  record(
    "LF-036",
    "Read activity feed",
    detailAfterComment.body?.activity?.some((a: { summary: string }) => a.summary.includes("posted a comment")),
    `Activity count ${detailAfterComment.body?.activity?.length ?? "n/a"}`,
  );

  const users = await officer.json("/api/users");
  const userNames = Array.isArray(users.body)
    ? users.body.map((user: { name: string }) => user.name)
    : [];
  record(
    "LF-038",
    "Users API",
    users.res.status === 200 &&
      userNames.includes("Priya Nair") &&
      userNames.includes("Alex Kim") &&
      userNames.includes("Empty Borrower"),
    `GET /api/users status ${users.res.status}; names=${userNames.join(", ")}`,
  );
  const loanList = await officer.json("/api/loans");
  const loanDetail = await officer.json("/api/loans/1");
  record(
    "LF-039",
    "Loans API list and detail",
    loanList.res.status === 200 &&
      Array.isArray(loanList.body) &&
      loanDetail.res.status === 200 &&
      loanDetail.body?.documents &&
      loanDetail.body?.tasks,
    `List status ${loanList.res.status}; detail status ${loanDetail.res.status}`,
  );

  const aidlc = await text(officer, "/aidlc");
  record(
    "LF-040",
    "AI-DLC artifact index",
    aidlc.res.status === 200 && aidlc.body.includes("LoanFlow delivery trail") && aidlc.body.includes("Requirements"),
    `GET /aidlc status ${aidlc.res.status}`,
  );
  const artifact = await text(officer, "/aidlc/state");
  const missingArtifact = await text(officer, "/aidlc/no-such-artifact");
  record(
    "LF-041",
    "AI-DLC artifact detail",
    artifact.res.status === 200 && artifact.body.includes("AI-DLC State") && missingArtifact.res.status === 404,
    `state status ${artifact.res.status}; missing status ${missingArtifact.res.status}`,
  );
  const lifecycleDiagram = await text(officer, "/aidlc/ai-dlc-lifecycle");
  record(
    "LF-052",
    "AI-DLC lifecycle HTML artifact slug",
    lifecycleDiagram.res.status === 200 &&
      lifecycleDiagram.body.includes("AI-DLC Lifecycle Diagram") &&
      lifecycleDiagram.body.includes("Agentic Level") &&
      lifecycleDiagram.body.includes("<iframe") &&
      lifecycleDiagram.body.includes("fixed inset-0 z-50 h-screen w-screen"),
    `GET /aidlc/ai-dlc-lifecycle status ${lifecycleDiagram.res.status}`,
  );
  const visualArtifactSlugs = [
    "loanflow-diagram",
    "loanflow-dev-process",
    "org-scaling",
    "persona-absorption",
    "persona-absorption-screenshot-01",
    "persona-absorption-screenshot-02",
    "loanflow-repository-diagram-readme",
    "loanflow-repository-diagram-runtime",
  ];
  const visualArtifactResponses = await Promise.all(
    visualArtifactSlugs.map(async (slug) => {
      const response = await text(officer, `/aidlc/${slug}`);
      return { slug, response };
    }),
  );
  const visualArtifactFailures = visualArtifactResponses
    .filter(({ response }) => response.res.status !== 200)
    .map(({ slug, response }) => `${slug}:${response.res.status}`);
  record(
    "LF-053",
    "LoanFlow repository diagram artifact bundle",
    visualArtifactFailures.length === 0 &&
      visualArtifactResponses.some(({ response }) => response.body.includes("fixed inset-0 z-50")) &&
      visualArtifactResponses.some(({ response }) => response.body.includes("max-h-full max-w-full")) &&
      visualArtifactResponses.some(({ response }) => response.body.includes("Claude Design")) &&
      visualArtifactResponses.some(({ response }) => response.body.includes("dc-runtime")),
    visualArtifactFailures.length === 0
      ? `${visualArtifactSlugs.length} visual artifact slugs returned 200`
      : `Failures: ${visualArtifactFailures.join(", ")}`,
  );
  const traceabilityLoop = await text(officer, "/aidlc/feature-traceability-loop");
  record(
    "LF-051",
    "AI-DLC feature traceability loop",
    traceabilityLoop.res.status === 200 &&
      traceabilityLoop.body.includes("Reverse Engineering Feature Traceability Loop") &&
      traceabilityLoop.body.includes("feature-status-tracker.csv") &&
      traceabilityLoop.body.includes("test every user behaviour again post fix"),
    `GET /aidlc/feature-traceability-loop status ${traceabilityLoop.res.status}`,
  );
  const awsV2Comparison = await text(officer, "/aidlc/aws-v2-comparison");
  record(
    "LF-054",
    "AWS v2 AI-DLC comparison artifact",
    awsV2Comparison.res.status === 200 &&
      awsV2Comparison.body.includes("AWS AI-DLC Workflows v2 vs LoanFlow AI-DLC") &&
      awsV2Comparison.body.includes("Side-by-Side Comparison") &&
      awsV2Comparison.body.includes("32 stages") &&
      awsV2Comparison.body.includes("feature-status-tracker.csv"),
    `GET /aidlc/aws-v2-comparison status ${awsV2Comparison.res.status}`,
  );
  const readme = await text(officer, "/readme");
  record(
    "LF-042",
    "README nav and page",
    readme.res.status === 200 &&
      readme.body.includes("Demo guide") &&
      readme.body.includes("What Has Not Been Built With AI-DLC"),
    `GET /readme status ${readme.res.status}`,
  );
  const featureTracker = await text(officer, "/feature-tracker");
  record(
    "LF-050",
    "Feature tracker nav and table page",
    featureTracker.res.status === 200 &&
      featureTracker.body.includes("Feature tracker") &&
      featureTracker.body.includes("LF-001") &&
      featureTracker.body.includes("Tracked stories"),
    `GET /feature-tracker status ${featureTracker.res.status}`,
  );
  const notFound = await text(officer, "/definitely-not-a-real-page");
  record(
    "LF-043",
    "Not-found page",
    notFound.res.status === 404 && notFound.body.includes("Not found") && notFound.body.includes("Back to pipeline"),
    `GET unknown page status ${notFound.res.status}`,
  );
}

main()
  .catch((error) => {
    results.push({
      id: "HARNESS",
      name: "Story check harness",
      status: "fail",
      detail: error instanceof Error ? error.stack ?? error.message : String(error),
    });
  })
  .finally(() => {
    const passed = results.filter((r) => r.status === "pass").length;
    const failed = results.filter((r) => r.status === "fail").length;
    for (const result of results) {
      const marker = result.status === "pass" ? "✓" : "✗";
      console.log(`${marker} ${result.id} ${result.name} — ${result.detail}`);
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
  });
