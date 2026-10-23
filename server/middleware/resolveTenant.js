'use strict';

var db = require('../db');

var DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

var FALLBACK_TENANT = {
  id: DEFAULT_TENANT_ID,
  name: 'SeeWhy LIVE',
  subdomain: 'app',
  plan_tier: 'pro',
  theme_config: null,
  feature_flags: null,
  active: true
};

var cache = new Map();
var CACHE_TTL_MS = 60 * 1000;

function subdomainFromHost(host) {
  if (!host) return 'app';
  var bare = host.split(':')[0];
  var parts = bare.split('.');
  if (parts.length < 3) return 'app';
  if (parts[0] === 'www') return 'app';
  return parts[0];
}

var dbReachable = true;
var dbRetryAt = 0;
var DB_RETRY_INTERVAL = 30 * 1000;

async function lookupTenant(host) {
  var subdomain = subdomainFromHost(host);
  var hit = cache.get(subdomain);

  if (hit && hit.expires > Date.now()) {
    if (!hit.tenant.active) {
      var cached = new Error('tenant suspended');
      cached.code = 'TENANT_SUSPENDED';
      throw cached;
    }
    return hit.tenant;
  }

  if (!dbReachable && Date.now() < dbRetryAt) {
    cache.set(subdomain, { tenant: FALLBACK_TENANT, expires: Date.now() + CACHE_TTL_MS });
    return FALLBACK_TENANT;
  }

  try {
    var result = await db.query(
      'SELECT id, name, subdomain, plan_tier, theme_config, feature_flags, active ' +
      'FROM tenants WHERE subdomain = $1',
      [subdomain]
    );

    dbReachable = true;
    var tenant = result.rows[0];
    if (!tenant) {
      var notFound = new Error('unknown tenant');
      notFound.code = 'TENANT_NOT_FOUND';
      throw notFound;
    }
    if (!tenant.active) {
      var suspended = new Error('tenant suspended');
      suspended.code = 'TENANT_SUSPENDED';
      throw suspended;
    }

    cache.set(subdomain, { tenant: tenant, expires: Date.now() + CACHE_TTL_MS });
    return tenant;
  } catch (err) {
    if (err.code === 'TENANT_NOT_FOUND' || err.code === 'TENANT_SUSPENDED') throw err;
    // DB unreachable (ENOTFOUND, ECONNREFUSED, ETIMEDOUT, etc.) — fall back to default tenant
    dbReachable = false;
    dbRetryAt = Date.now() + DB_RETRY_INTERVAL;
    console.error('resolveTenant: DB unreachable, using fallback tenant:', err.message);
    cache.set(subdomain, { tenant: FALLBACK_TENANT, expires: Date.now() + CACHE_TTL_MS });
    return FALLBACK_TENANT;
  }
}

async function resolveTenant(req, res, next) {
  // Health check bypasses tenant resolution so the server is always monitorable
  if (req.path === '/api/health' || req.path === '/health') {
    req.tenant = FALLBACK_TENANT;
    req.tenantId = DEFAULT_TENANT_ID;
    return next();
  }
  try {
    var tenant = await lookupTenant(req.hostname);
    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (err) {
    if (err.code === 'TENANT_NOT_FOUND') return res.status(404).json({ error: 'unknown tenant' });
    if (err.code === 'TENANT_SUSPENDED') return res.status(403).json({ error: 'tenant suspended' });
    console.error('resolveTenant error', err);
    res.status(500).json({ error: 'tenant resolution failed' });
  }
}

async function forSocket(host) {
  return lookupTenant(host);
}

module.exports = resolveTenant;
module.exports.forSocket = forSocket;
module.exports.DEFAULT_TENANT_ID = DEFAULT_TENANT_ID;
