'use strict';
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: process.env.SUPABASE_CA_CERT
    ? { rejectUnauthorized: true, ca: fs.readFileSync(process.env.SUPABASE_CA_CERT).toString() }
    : { rejectUnauthorized: true },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
