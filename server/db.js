'use strict';
const { Pool } = require('pg');
const fs = require('fs');

// SUPABASE_DB_URL must be the direct Postgres connection string from:
// Supabase dashboard → Project Settings → Database → Connection string (URI)
// Example: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
// For high-traffic use the pooler (port 6543) instead of direct (port 5432).
if (!process.env.SUPABASE_DB_URL) {
  console.error('[db] CRITICAL: SUPABASE_DB_URL is not set — Postgres features unavailable.');
  console.error('[db] Get the connection string from Supabase → Project Settings → Database → URI');
}

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: process.env.SUPABASE_CA_CERT
    ? { rejectUnauthorized: true, ca: fs.readFileSync(process.env.SUPABASE_CA_CERT).toString() }
    : { rejectUnauthorized: true },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
});

var _pgUp = false;
var _pgProbeTimer = null;
var _pgBackoffMs = 5000;
var _pgMaxBackoffMs = 60000;

function _scheduleProbe() {
  if (_pgProbeTimer) return;
  _pgProbeTimer = setTimeout(function() {
    _pgProbeTimer = null;
    pool.query('SELECT 1')
      .then(function() {
        if (!_pgUp) {
          _pgUp = true;
          _pgBackoffMs = 5000;
          console.info('[db] Postgres reconnected ✓');
        }
      })
      .catch(function(err) {
        _pgUp = false;
        _pgBackoffMs = Math.min(_pgBackoffMs * 2, _pgMaxBackoffMs);
        console.warn('[db] Postgres probe failed (' + err.message + '), retrying in ' + (_pgBackoffMs / 1000) + 's');
        _scheduleProbe();
      });
  }, _pgBackoffMs);
}

pool.on('connect', function() {
  if (!_pgUp) {
    _pgUp = true;
    _pgBackoffMs = 5000;
    console.info('[db] Postgres connected ✓');
  }
});

pool.on('error', function(err) {
  _pgUp = false;
  console.error('[db] Postgres pool error:', err.message);
  _scheduleProbe();
});

// Kick off an initial probe so startup logs show Postgres status quickly
pool.query('SELECT 1')
  .then(function() { _pgUp = true; console.info('[db] Postgres ready ✓'); })
  .catch(function(err) {
    console.error('[db] Postgres unavailable at startup:', err.message);
    _scheduleProbe();
  });

function query(text, params) {
  return pool.query(text, params).catch(function(err) {
    var TRANSIENT = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'CONNECTION_TERMINATED'];
    var isTransient = TRANSIENT.indexOf(err.code) >= 0 ||
      (err.message && /connection|ENOTFOUND|ECONNREFUSED|timeout/i.test(err.message));
    if (isTransient) {
      _pgUp = false;
      _scheduleProbe();
    }
    throw err;
  });
}

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
  query: query,
  pool,
  withUserContext,
  isPgUp: function() { return _pgUp; },
};
