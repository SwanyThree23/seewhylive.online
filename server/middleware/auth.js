'use strict';

var jwt = require('jsonwebtoken');

// Valid roles ordered from least to most privileged
var ROLE_RANK = { viewer: 0, guest: 1, cohost: 2, host: 3, owner: 4, admin: 5 };

function extractRole(decoded) {
  // Supabase Auth JWT stores custom role in app_metadata
  if (decoded.app_metadata && decoded.app_metadata.role) return decoded.app_metadata.role;
  // Fall back to top-level role claim (our own JWTs)
  return decoded.role || 'viewer';
}

function requireAuth(req, res, next) {
  var header = req.headers.authorization || '';
  var token  = header.startsWith('Bearer ') ? header.slice(7) : header;

  if (!token) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (!process.env.JWT_SECRET) {
    var _env = process.env.NODE_ENV || '';
    if (_env === 'development' || _env === 'test') {
      req.user = { id: 'anon', userId: 'anon', role: 'viewer', tenantId: req.tenantId };
      return next();
    }
    return res.status(500).json({ error: 'server misconfigured: JWT_SECRET not set' });
  }

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    var uid = decoded.userId || decoded.sub || decoded.id;

    if (decoded.tenantId && req.tenantId && decoded.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'token not valid for this dashboard' });
    }

    var role = extractRole(decoded);
    req.user = { id: uid, userId: uid, role: role, tenantId: decoded.tenantId || req.tenantId };
    next();
  } catch (_) {
    res.status(401).json({ error: 'invalid token' });
  }
}

/**
 * requireRole(roles) — middleware factory.
 *
 * Accepts a string or array of allowed roles.
 * Also allows any role with a higher rank (e.g. requireRole('host') lets 'owner'
 * and 'admin' through automatically).
 *
 * Usage:
 *   router.post('/start', requireAuth, requireRole(['host', 'owner']), handler);
 *   router.delete('/room', requireAuth, requireRole('admin'), handler);
 */
function requireRole(roles) {
  var allowed = Array.isArray(roles) ? roles : [roles];
  var minRank = allowed.reduce(function(min, r) {
    var rank = ROLE_RANK[r];
    return (rank !== undefined && rank < min) ? rank : min;
  }, Infinity);

  return function(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    var userRank = ROLE_RANK[req.user.role];
    if (userRank === undefined || userRank < minRank) {
      var needed = allowed.join(' or ');
      return res.status(403).json({ error: 'requires role: ' + needed });
    }
    next();
  };
}

/**
 * requireOwnerOrSelf(paramName) — allows access when the route param matches
 * the authenticated user's id, or the user is admin/owner.
 *
 * Usage:
 *   router.get('/:userId/profile', requireAuth, requireOwnerOrSelf('userId'), handler);
 */
function requireOwnerOrSelf(paramName) {
  return function(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    var paramId = req.params && req.params[paramName];
    if (paramId === req.user.id) return next();
    if (req.user.role === 'admin' || req.user.role === 'owner') return next();
    return res.status(403).json({ error: 'forbidden' });
  };
}

module.exports = requireAuth;
module.exports.requireRole      = requireRole;
module.exports.requireOwnerOrSelf = requireOwnerOrSelf;
module.exports.ROLE_RANK        = ROLE_RANK;
