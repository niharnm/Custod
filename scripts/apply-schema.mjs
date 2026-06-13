// One-off: apply supabase/schema.sql to the database. Tolerant of objects that
// already exist (re-runnable). Reads the direct (non-pooling) Postgres URL.
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url) {
  console.error("Missing POSTGRES_URL_NON_POOLING");
  process.exit(1);
}

const sql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

// Split into statements on semicolons at line ends (naive but fine for this DDL file).
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

let ok = 0, skipped = 0, failed = 0;
for (const stmt of statements) {
  try {
    await client.query(stmt);
    ok++;
  } catch (e) {
    const msg = String(e.message || e);
    if (/already exists|duplicate/i.test(msg)) {
      skipped++;
    } else {
      failed++;
      console.error("  ✗", msg.split("\n")[0], "::", stmt.slice(0, 60).replace(/\s+/g, " "));
    }
  }
}
console.log(`done: ${ok} applied, ${skipped} already-existed, ${failed} failed`);

// Verify the critical table exists now.
const { rows } = await client.query(
  "select table_name from information_schema.tables where table_schema='public' and table_name in ('scans','devices','scan_events','privacy_settings','share_links') order by table_name"
);
console.log("tables present:", rows.map((r) => r.table_name).join(", ") || "(none)");
await client.end();
