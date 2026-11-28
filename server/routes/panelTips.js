'use strict';
var express = require('express');
var router = express.Router();
var db = require('../db');
var Database = require('better-sqlite3');
var stripeModule = require('../stripe');
var requireAuth = require('../middleware/auth');
var crypto = require('crypto');
var logger = require('../lib/logger');

// Immutable revenue split
var CREATOR_SPLIT = 0.90;

var _sqliteDb = null;
function getSqliteDb() {
  if (!_sqliteDb) {
    var dbPath = process.env.DB_PATH || '/opt/seewhy/data/seewhy.db';
    _sqliteDb = new Database(dbPath);
    _sqliteDb.pragma('journal_mode = WAL');
  }
  return _sqliteDb;
}

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/panel-tips/:streamId — create a Stripe PaymentIntent for a panel tip
// Body: { amountCents, message, senderName }
router.post('/:streamId', requireAuth, async function(req, res) {
  var streamId = req.params.streamId;
  if (!UUID_RE.test(streamId)) return res.status(400).json({ error: 'invalid stream id' });

  var amountCents = parseInt(req.body.amountCents, 10);
  if (!Number.isFinite(amountCents) || amountCents < 100) {
    return res.status(400).json({ error: 'amountCents must be at least 100' });
  }
  var message = String(req.body.message || '').slice(0, 280);
  var senderName = String(req.body.senderName || req.user.id).slice(0, 80);
  var senderId = req.user.id;

  try {
    // Look up stream and creator
    var streamResult = await db.query(
      'SELECT id, creator_id, tenant_id FROM streams WHERE id = $1 AND tenant_id = $2',
      [streamId, req.tenantId]
    );
    if (!streamResult.rows[0]) return res.status(404).json({ error: 'stream not found' });
    var row = streamResult.rows[0];
    var creatorId = row.creator_id;

    // Look up creator's Stripe Connect account (stored in SQLite user_profiles)
    var sqliteDb = getSqliteDb();
    var profileRow = sqliteDb.prepare('SELECT stripe_account_id FROM user_profiles WHERE user_id = ?').get(creatorId);
    var creatorStripeAccountId = (profileRow && profileRow.stripe_account_id && /^acct_[A-Za-z0-9]{8,32}$/.test(profileRow.stripe_account_id))
      ? profileRow.stripe_account_id
      : '';

    var io = req.app.get('io');
    var tipData = {
      streamId: streamId,
      tenantId: req.tenantId,
      senderId: senderId,
      senderName: senderName,
      amountCents: amountCents,
      message: message,
    };

    // onConfirmed fires when Stripe webhook confirms payment.
    // Capture all values into tipData so req/res are not held alive.
    var onConfirmed = function() {
      var tipId = crypto.randomUUID();
      var creatorCents = Math.floor(tipData.amountCents * CREATOR_SPLIT);
      var platformCents = tipData.amountCents - creatorCents;
      db.query(
        'INSERT INTO panel_tips (id, stream_id, tenant_id, sender_id, sender_name, amount_cents, creator_cents, platform_cents, message, stripe_payment_intent_id, status) ' +
        'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT DO NOTHING',
        [tipId, tipData.streamId, tipData.tenantId, tipData.senderId, tipData.senderName, tipData.amountCents, creatorCents, platformCents, tipData.message || null, tipData._piId, 'confirmed']
      ).catch(function(err) {
        logger.error('[panelTips] DB insert failed', { err: err.message });
      });
      // Emit real-time tip alert to everyone in the room
      if (io) {
        io.to(tipData.streamId).emit('panel:tip-alert', {
          senderName: tipData.senderName,
          amountCents: tipData.amountCents,
          message: tipData.message,
          ts: Date.now(),
        });
      }
    };

    var result = await stripeModule.createPanelTipIntent(streamId, senderId, senderName, amountCents, creatorStripeAccountId);
    // Register the confirmed callback keyed by paymentIntentId
    tipData._piId = result.paymentIntentId;
    stripeModule.registerPaymentCallback(result.paymentIntentId, onConfirmed);
    res.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amountCents: result.amountCents,
    });
  } catch (err) {
    logger.error('[panelTips] POST error', { err: err.message });
    res.status(500).json({ error: 'Failed to create tip payment' });
  }
});

module.exports = router;
