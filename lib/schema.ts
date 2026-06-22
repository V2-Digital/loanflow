// SQL schema for LoanFlow. Applied idempotently on first DB open.

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  email     TEXT NOT NULL UNIQUE,
  role      TEXT NOT NULL,
  orgName   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS loans (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  businessName  TEXT NOT NULL,
  amount        INTEGER NOT NULL,
  purpose       TEXT NOT NULL,
  termMonths    INTEGER NOT NULL,
  contactName   TEXT NOT NULL,
  contactEmail  TEXT NOT NULL,
  stage         TEXT NOT NULL DEFAULT 'draft',
  decision      TEXT,
  decisionNote  TEXT,
  borrowerId    INTEGER NOT NULL REFERENCES users(id),
  createdAt     TEXT NOT NULL,
  updatedAt     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS loan_members (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  loanId      INTEGER NOT NULL REFERENCES loans(id),
  userId      INTEGER NOT NULL REFERENCES users(id),
  roleOnLoan  TEXT NOT NULL,
  UNIQUE(loanId, userId)
);

CREATE TABLE IF NOT EXISTS documents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  loanId        INTEGER NOT NULL REFERENCES loans(id),
  name          TEXT NOT NULL,
  docType       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'requested',
  note          TEXT,
  requestedById INTEGER NOT NULL REFERENCES users(id),
  uploadedById  INTEGER REFERENCES users(id),
  dueDate       TEXT,
  updatedAt     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  loanId       INTEGER NOT NULL REFERENCES loans(id),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'todo',
  assigneeId   INTEGER REFERENCES users(id),
  createdById  INTEGER NOT NULL REFERENCES users(id),
  dueDate      TEXT,
  createdAt    TEXT NOT NULL,
  updatedAt    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  loanId    INTEGER NOT NULL REFERENCES loans(id),
  authorId  INTEGER NOT NULL REFERENCES users(id),
  body      TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  loanId    INTEGER NOT NULL REFERENCES loans(id),
  actorId   INTEGER NOT NULL REFERENCES users(id),
  verb      TEXT NOT NULL,
  summary   TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stage_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  loanId    INTEGER NOT NULL REFERENCES loans(id),
  fromStage TEXT,
  toStage   TEXT NOT NULL,
  actorId   INTEGER NOT NULL REFERENCES users(id),
  note      TEXT,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrowerId);
CREATE INDEX IF NOT EXISTS idx_members_loan ON loan_members(loanId);
CREATE INDEX IF NOT EXISTS idx_documents_loan ON documents(loanId);
CREATE INDEX IF NOT EXISTS idx_tasks_loan ON tasks(loanId);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assigneeId);
CREATE INDEX IF NOT EXISTS idx_comments_loan ON comments(loanId);
CREATE INDEX IF NOT EXISTS idx_activity_loan ON activity(loanId);
CREATE INDEX IF NOT EXISTS idx_stage_events_loan ON stage_events(loanId);
`;
