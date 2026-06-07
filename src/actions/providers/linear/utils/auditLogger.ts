import Database from "better-sqlite3";
import { join } from "path";

const DB_PATH = join(process.cwd(), "audit.db");

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    user_email TEXT,
    action_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    input_args TEXT,
    result_summary TEXT,
    error TEXT
  )
`;

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.exec(CREATE_TABLE_SQL);
  }
  return db;
}

export interface AuditEntry {
  timestamp: string;
  userEmail?: string;
  actionName: string;
  provider: string;
  inputArgs: string;
  resultSummary: string;
  error?: string;
}

export function logAction(entry: AuditEntry): void {
  try {
    const database = getDb();
    const stmt = database.prepare(`
      INSERT INTO audit_log (timestamp, user_email, action_name, provider, input_args, result_summary, error)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      entry.timestamp,
      entry.userEmail ?? null,
      entry.actionName,
      entry.provider,
      entry.inputArgs,
      entry.resultSummary,
      entry.error ?? null,
    );
  } catch (err) {
    console.error("[auditLogger] Failed to write audit log entry:", err);
  }
}
