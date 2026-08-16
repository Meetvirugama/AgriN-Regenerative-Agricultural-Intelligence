import fs from "fs";
import path from "path";
import { pool } from "./connection.js";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

/**
 * Migration runner.
 *
 * Runs all .sql files in the migrations/ directory in alphabetical order.
 * Skips migrations that have already been applied (tracked in schema_migrations table).
 *
 * Usage:
 *   npx tsx src/db/migrate.ts
 */
async function runMigrations() {
  console.log("[Migrate] Starting migration runner...");

  const client = await pool.connect();

  try {
    // Create the tracking table if it doesn't exist yet
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query(
      "SELECT version FROM schema_migrations ORDER BY version",
    );
    const appliedSet = new Set(applied.map((r) => r.version));

    // Read all .sql files in migrations/ directory, sorted alphabetically
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let ran = 0;
    let skipped = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`[Migrate] ⏩ Skipping ${file} (already applied)`);
        skipped++;
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      console.log(`[Migrate] ▶  Running ${file}...`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (version) VALUES ($1)",
          [file],
        );
        await client.query("COMMIT");
        console.log(`[Migrate] ✅ ${file} applied successfully`);
        ran++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`[Migrate] ❌ ${file} failed: ${err.message}`);
        throw err;
      }
    }

    console.log(
      `[Migrate] Done. Ran: ${ran}, Skipped (already applied): ${skipped}`,
    );
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("[Migrate] Fatal error:", err);
  process.exit(1);
});
