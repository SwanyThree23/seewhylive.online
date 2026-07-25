'use strict';

var jwt = require('jsonwebtoken');

/**
 * Express middleware — verify JWT from Authorization: Bearer <token> header
 * and populate req.user for downstream route handlers.
 *
 * Success: req.user = { id, userId, role }; calls next()
 * Failure: 401 JSON { error: 'unauthorized' | 'invalid token' }
 *
 * Matches the socket.io auth logic in index.js: when JWT_SECRET is absent
 * (dev mode) any request is admitted as an anon viewer.
 */
function requireAuth(req, res, next) {
  var header = req.headers.authorization || '';
  var token  = header.startsWith('Bearer ') ? header.slice(7) : header;

  if (!token) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'server misconfigured: JWT_SECRET not set' });
    }
    req.user = { id: 'anon', userId: 'anon', role: 'viewer' };
    return next();
  }

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    var uid = decoded.userId || decoded.sub || decoded.id;
    req.user = { id: uid, userId: uid, role: decoded.role || 'viewer' };
    next();
  } catch (_) {
    res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = requireAuth;
