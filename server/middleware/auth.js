'use strict';

var jwt = require('jsonwebtoken');

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
    var decoded = jwt.verify(token, process.env.JWT_SECRET);
    var uid = decoded.userId || decoded.sub || decoded.id;

    if (decoded.tenantId && req.tenantId && decoded.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'token not valid for this dashboard' });
    }

    req.user = { id: uid, userId: uid, role: decoded.role || 'viewer', tenantId: decoded.tenantId || req.tenantId };
    next();
  } catch (_) {
    res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = requireAuth;
