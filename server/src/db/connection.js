import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "[DB] DATABASE_URL environment variable is not set.\n" +
      "Copy server/.env.example → server/.env and set DATABASE_URL=postgresql://user:password@localhost:5432/agrimesh",
  );
}

/**
 * Singleton PostgreSQL connection pool.
 *
 * Configuration is read from DATABASE_URL in the environment.
 * Connection pooling ensures efficient reuse across requests.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep 2 idle connections, allow up to 10 total
  min: 2,
  max: 10,
  // Discard connections idle for > 30 seconds
  idleTimeoutMillis: 30_000,
  // Fail fast if pool is exhausted after 5 seconds
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

pool.on("connect", () => {
  console.log("[DB] New connection established");
});

/**
 * Execute a query and return all rows.
 * Use this for SELECT queries.
 */
export async function query(sql, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Execute a query and return the first row or null.
 * Use this for single-record lookups.
 */
export async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

/**
 * Execute a query and return the number of affected rows.
 * Use this for INSERT/UPDATE/DELETE.
 */
export async function execute(sql, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rowCount ?? 0;
  } finally {
    client.release();
  }
}

/**
 * Run multiple queries in a single transaction.
 * If any query throws, the entire transaction is rolled back.
 *
 * Usage:
 *   await transaction(async (client) => {
 *     await client.query('INSERT ...');
 *     await client.query('UPDATE ...');
 *   });
 */
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Check that the database connection is healthy.
 * Used by the /health endpoint and startup checks.
 */
export async function checkDatabaseHealth() {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
