const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Anon-key client — this is the client used to authenticate end users,
// separate from the service-role client used elsewhere for admin ops.
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { realtime: { transport: ws } }
);

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
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
