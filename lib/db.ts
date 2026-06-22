import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { SCHEMA_SQL } from "./schema";

// Singleton SQLite connection. Reused across hot reloads in dev.
declare global {
  // eslint-disable-next-line no-var
  var __loanflowDb: Database.Database | undefined;
}

function open(): Database.Database {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const dbPath = process.env.LOANFLOW_DB_PATH ?? path.join(dir, "loanflow.db");
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA_SQL);
  return db;
}

export const db: Database.Database = global.__loanflowDb ?? open();
if (process.env.NODE_ENV !== "production") global.__loanflowDb = db;

export function nowIso(): string {
  return new Date().toISOString();
}
