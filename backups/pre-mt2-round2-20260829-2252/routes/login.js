const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { rateLimit } = require('express-rate-limit');
const ws = require('ws');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db');

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: function(req) { return req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many login attempts — please wait 15 minutes.' },
});

async function claimOwnershipIfEligible(tenantId, userId, email) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const tenantRes = await client.query(
      'SELECT owner_id, owner_email FROM tenants WHERE id = $1 FOR UPDATE',
      [tenantId]
    );
    const tenant = tenantRes.rows[0];
    const eligible = tenant && !tenant.owner_id && tenant.owner_email &&
      tenant.owner_email.toLowerCase() === email.toLowerCase();

    if (!eligible) {
      await client.query('ROLLBACK');
      return null;
    }

    const userRes = await client.query(
      `INSERT INTO users (id, tenant_id, email, account_type, display_name)
       VALUES ($1, $2, $3, 'owner', $4)
       ON CONFLICT (id, tenant_id) DO NOTHING
       RETURNING account_type`,
      [userId, tenantId, email, email.split('@')[0]]
    );

    await client.query(
      'UPDATE tenants SET owner_id = $1, owner_email = NULL WHERE id = $2',
      [userId, tenantId]
    );

    await client.query('COMMIT');
    return userRes.rows[0] || { account_type: 'owner' };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[login] ownership claim failed', err.message);
    return null;
  } finally {
    client.release();
  }
}

router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const email    = String(req.body.email    || '').slice(0, 254).trim();
    const password = String(req.body.password || '').slice(0, 1000);
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const { user } = data;

    const { data: profile, error: profileErr } = await supabaseAuth
      .from('users')
      .select('account_type')
      .eq('id', user.id)
      .eq('tenant_id', req.tenantId)
      .maybeSingle();

    if (profileErr) {
      return res.status(500).json({ error: 'Login failed' });
    }

    var finalProfile = profile;
    if (!finalProfile) {
      finalProfile = await claimOwnershipIfEligible(req.tenantId, user.id, email);
    }
    if (!finalProfile) {
      return res.status(403).json({ error: 'This account is not registered on this dashboard' });
    }

    var role = finalProfile.account_type || 'standard';

    return res.json({
      token: jwt.sign(
        { userId: user.id, role: role, tenantId: req.tenantId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      ),
      role: role,
      userId: user.id,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
