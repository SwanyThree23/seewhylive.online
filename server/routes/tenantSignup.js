'use strict';
var express = require('express');
var router = express.Router();
var { rateLimit } = require('express-rate-limit');
var tenantBilling = require('../tenantBilling');

var signupRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: function(req) { return req.ip; },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests — please slow down.' },
});

router.get('/check-subdomain', signupRateLimit, async function(req, res) {
  try {
    var name = String(req.query.name || '');
    var result = await tenantBilling.isSubdomainAvailable(name);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/checkout', signupRateLimit, async function(req, res) {
  try {
    var body = req.body || {};
    var planTier = body.planTier;
    var desiredSubdomain = body.desiredSubdomain;
    var email = body.email;
    if (!planTier || typeof planTier !== 'string') {
      return res.status(400).json({ error: 'planTier is required' });
    }
    if (!desiredSubdomain || typeof desiredSubdomain !== 'string') {
      return res.status(400).json({ error: 'desiredSubdomain is required' });
    }
    if (email && (typeof email !== 'string' || email.length > 254)) {
      return res.status(400).json({ error: 'invalid email' });
    }
    var session = await tenantBilling.createTenantCheckoutSession({ planTier: planTier, desiredSubdomain: desiredSubdomain, email: email });
    res.json(session);
  } catch (err) {
    var CHECKOUT_USER_ERRS = ['invalid plan tier'];
    var isUserErr = CHECKOUT_USER_ERRS.includes(err.message) ||
      (typeof err.message === 'string' && err.message.indexOf('subdomain not available:') === 0);
    res.status(isUserErr ? 400 : 500).json({ error: isUserErr ? err.message : 'Internal server error' });
  }
});

module.exports = router;
