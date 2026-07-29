const { Pool } = require('pg');
const pool = new Pool({ connectionString: require('fs').readFileSync('/opt/seewhy/server/.env','utf8').match(/SUPABASE_DB_URL=(\S+)/)[1], ssl: { rejectUnauthorized: false } });
pool.query("UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'testuser@seewhylive.online' RETURNING id, email, email_confirmed_at;")
  .then(r => { console.log(r.rows); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
