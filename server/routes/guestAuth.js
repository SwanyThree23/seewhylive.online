'use strict';
var express = require('express');
var jwt = require('jsonwebtoken');
var db = require('../db');
var router = express.Router();

router.post('/token', async function (req, res) {
  var inviteToken = req.body.inviteToken;
  if (!inviteToken) return res.status(400).json({ error: 'inviteToken is required' });

  try {
    var result = await db.query('SELECT * FROM accept_guest_invitation($1)', [inviteToken]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(403).json({ error: 'invalid or expired invite' });
    }
    var row = result.rows[0];

    var token = jwt.sign(
      { userId: row.invitation_id, role: 'guest', tenantId: row.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );

    res.json({ token: token, destinationId: row.destination_id, streamId: row.stream_id });
  } catch (err) {
    console.error('guestAuth /token failed', err);
    res.status(500).json({ error: 'could not issue guest token' });
  }
});

module.exports = router;
