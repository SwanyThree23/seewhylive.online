'use strict';

var db = require('./db');
var crypto = require('crypto');
var { getStripe } = require('./stripe');

var PLAN_PRICE_IDS = {
  starter:    process.env.STRIPE_PRICE_STARTER,
  pro:        process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

var PLAN_FEATURES = {
  starter:    { panelDiscussion: true,  pkBattleArena: false, watchParties: false, maxGuests: 6 },
  pro:        { panelDiscussion: true,  pkBattleArena: true,  watchParties: true,  maxGuests: 20 },
  enterprise: { panelDiscussion: true,  pkBattleArena: true,  watchParties: true,  maxGuests: 20, customDomain: true },
};

var VALID_PLANS = Object.keys(PLAN_PRICE_IDS);
var SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
var RESERVED_SUBDOMAINS = ['app', 'api', 'www', 'admin', 'mail', 'ftp', 'staging', 'dev', 'test'];

function isValidPlan(planTier) {
  return VALID_PLANS.indexOf(planTier) !== -1 && !!PLAN_PRICE_IDS[planTier];
}

async function isSubdomainAvailable(subdomain) {
  var s = String(subdomain || '').toLowerCase().trim();
  if (!SUBDOMAIN_RE.test(s)) return { available: false, reason: 'invalid format' };
  if (RESERVED_SUBDOMAINS.indexOf(s) !== -1) return { available: false, reason: 'reserved' };
  var result = await db.query('SELECT 1 FROM tenants WHERE subdomain = $1', [s]);
  if (result.rows.length) return { available: false, reason: 'taken' };
  return { available: true };
}

async function createTenantCheckoutSession({ planTier, desiredSubdomain, email }) {
  if (!isValidPlan(planTier)) throw new Error('invalid plan tier');
  var check = await isSubdomainAvailable(desiredSubdomain);
  if (!check.available) throw new Error('subdomain not available: ' + check.reason);

  var stripe = getStripe();
  var origin = process.env.FRONTEND_ORIGIN || 'https://seewhylive.online';

  var session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email || undefined,
    line_items: [{ price: PLAN_PRICE_IDS[planTier], quantity: 1 }],
    success_url: origin + '/onboard?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: origin + '/pricing',
    metadata: {
      service: 'seewhy-tenant-signup',
      planTier: planTier,
      desiredSubdomain: String(desiredSubdomain).toLowerCase().trim(),
    },
  });

  return { checkoutUrl: session.url, sessionId: session.id };
}

async function handleTenantCheckoutCompleted(session) {
  var meta = session.metadata || {};
  if (meta.service !== 'seewhy-tenant-signup') return null;

  var planTier = meta.planTier;
  var subdomain = meta.desiredSubdomain;
  if (!isValidPlan(planTier) || !subdomain) {
    console.error('[tenantBilling] webhook missing/invalid metadata', meta);
    return null;
  }

  var existing = await db.query(
    'SELECT * FROM tenants WHERE stripe_subscription_id = $1',
    [session.subscription]
  );
  if (existing.rows[0]) return existing.rows[0];

  var finalSubdomain = subdomain;
  var avail = await isSubdomainAvailable(finalSubdomain);
  if (!avail.available) {
    finalSubdomain = subdomain + '-' + crypto.randomBytes(3).toString('hex');
  }

  var ownerEmail = (session.customer_details && session.customer_details.email) || session.customer_email || null;

  var result = await db.query(
    `INSERT INTO tenants (name, subdomain, plan_tier, feature_flags, stripe_customer_id, stripe_subscription_id, owner_email, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)
     RETURNING *`,
    [
      finalSubdomain,
      finalSubdomain,
      planTier,
      JSON.stringify(PLAN_FEATURES[planTier]),
      session.customer,
      session.subscription,
      ownerEmail,
    ]
  );

  return result.rows[0];
}

async function createBillingPortalSession(tenantId) {
  var result = await db.query('SELECT stripe_customer_id FROM tenants WHERE id = $1', [tenantId]);
  var row = result.rows[0];
  if (!row || !row.stripe_customer_id) throw new Error('tenant has no billing account on file');

  var stripe = getStripe();
  var origin = process.env.FRONTEND_ORIGIN || 'https://seewhylive.online';
  var portalSession = await stripe.billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: origin + '/admin/billing',
  });
  return { portalUrl: portalSession.url };
}

module.exports = {
  PLAN_FEATURES,
  isSubdomainAvailable,
  createTenantCheckoutSession,
  handleTenantCheckoutCompleted,
  createBillingPortalSession,
};
