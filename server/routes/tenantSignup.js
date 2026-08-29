'use strict';

const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const tenantBilling = require('../tenantBilling');

const signupRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: function(req) { return req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests — please slow down.' },
});

router.get('/check-subdomain', signupRateLimit, async (req, res) => {
  try {
    const name = String(req.query.name || '');
    const result = await tenantBilling.isSubdomainAvailable(name);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/checkout', signupRateLimit, async (req, res) => {
  try {
    const { planTier, desiredSubdomain, email } = req.body || {};
    if (!planTier || typeof planTier !== 'string') {
      return res.status(400).json({ error: 'planTier is required' });
    }
    if (!desiredSubdomain || typeof desiredSubdomain !== 'string') {
      return res.status(400).json({ error: 'desiredSubdomain is required' });
    }
    if (email && (typeof email !== 'string' || email.length > 254)) {
      return res.status(400).json({ error: 'invalid email' });
    }
    const session = await tenantBilling.createTenantCheckoutSession({ planTier, desiredSubdomain, email });
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
