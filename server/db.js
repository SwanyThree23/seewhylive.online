'use strict';
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: process.env.SUPABASE_CA_CERT
    ? { rejectUnauthorized: true, ca: fs.readFileSync(process.env.SUPABASE_CA_CERT).toString() }
    : { rejectUnauthorized: true },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

/**
 * withUserContext — run a callback inside a transaction with RLS session vars set.
 *
 * The migration's app_user_id() / app_user_role() helpers read these settings
 * so server-issued queries enforce the same row-level isolation as Supabase
 * Auth-token requests.
 *
 * Usage:
 *   const result = await db.withUserContext(req.user.id, req.user.role, async (client) => {
 *     return client.query('SELECT * FROM streams WHERE creator_id = $1', [req.user.id]);
 *   });
 */
async function withUserContext(userId, role, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT
         set_config('app.current_user_id', $1, true),
         set_config('app.current_role',    $2, true)`,
      [userId || '', role || 'viewer']
    );
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  withUserContext,
};
