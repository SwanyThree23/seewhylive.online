const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { rateLimit } = require('express-rate-limit');
const ws = require('ws');
const jwt = require('jsonwebtoken');
const router = express.Router();

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

router.post('/login', loginRateLimit, async (req, res) => {
  const email    = String(req.body.email    || '').slice(0, 254).trim();
  const password = String(req.body.password || '').slice(0, 1000);
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  if (error) {
    return res.status(401).json({ error: error.message });
  }

  const { user, session } = data;

  const { data: profile, error: profileErr } = await supabaseAuth
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileErr) {
    return res.status(500).json({ error: 'Failed to load profile role' });
  }

  return res.json({
    token: jwt.sign({ userId: user.id, role: profile.role }, process.env.JWT_SECRET, { expiresIn: '7d' }),
    role: profile.role,
    userId: user.id,
  });
});

module.exports = router;
