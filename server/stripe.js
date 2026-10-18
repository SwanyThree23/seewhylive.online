'use strict';

/**
 * stripe.js - Stripe Connect + PPV payments for SeeWhy LIVE v33.0
 * All monetary values are INTEGER cents. Math.floor() on every calculation.
 * Split is immutable: CREATOR 90%, PLATFORM 10%.
 */

var Stripe = require('stripe');
var jwt = require('jsonwebtoken');
var Database = require('better-sqlite3');

// Callbacks registered by socket handlers when a paid gift PaymentIntent is created.
// On payment_intent.succeeded the callback is fired to commit the gift to DB + broadcast.
// Entries auto-expire after 30 minutes to prevent unbounded growth.
var _pendingGiftCallbacks = new Map(); // paymentIntentId -> { cb, expiresAt }
var _GIFT_CB_TTL_MS = 30 * 60 * 1000;
setInterval(function() {
  var now = Date.now();
  _pendingGiftCallbacks.forEach(function(v, k) { if (now > v.expiresAt) _pendingGiftCallbacks.delete(k); });
}, 5 * 60 * 1000).unref();

// ─── Immutable revenue split ──────────────────────────────────────────────
var CREATOR = 0.90;

// ─── Stripe client ────────────────────────────────────────────────────────
var stripeClient = null;

function getStripe() {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY env var is required');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
  }
  return stripeClient;
}

// ─── DB helper ────────────────────────────────────────────────────────────
var _db = null;

function getDb() {
  if (!_db) {
    var dbPath = process.env.DB_PATH || '/opt/seewhy/data/seewhy.db';
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS ppv_unlocks (
        id              TEXT    PRIMARY KEY,
        room_id         TEXT    NOT NULL,
        viewer_id       TEXT    NOT NULL,
        payment_intent_id TEXT  NOT NULL UNIQUE,
        amount_cents    INTEGER NOT NULL,
        creator_cents   INTEGER NOT NULL,
        platform_cents  INTEGER NOT NULL,
        status          TEXT    NOT NULL DEFAULT 'pending',
        created_at      INTEGER NOT NULL,
        completed_at    INTEGER
      );
    `);
  }
  return _db;
}

async function createPPVPaymentIntent(roomId, viewerId, priceUsd, creatorStripeAccountId) {
  var stripe = getStripe();
  var db = getDb();

  var amountCents = Math.floor(priceUsd * 100);
  var creatorCents = Math.floor(amountCents * CREATOR);
  var platformCents = amountCents - creatorCents;

  var paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      application_fee_amount: platformCents,
      transfer_data: {
        destination: creatorStripeAccountId
      },
      metadata: {
        roomId: roomId,
        viewerId: viewerId,
        service: 'seewhy-ppv'
      }
    });
  } catch (err) {
    throw new Error('Stripe PaymentIntent creation failed: ' + err.message);
  }

  var id = paymentIntent.id + '_' + Math.floor(Date.now() / 1000);
  var now = Math.floor(Date.now() / 1000);

  try {
    db.prepare(`
      INSERT OR IGNORE INTO ppv_unlocks
        (id, room_id, viewer_id, payment_intent_id, amount_cents, creator_cents, platform_cents, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(id, roomId, viewerId, paymentIntent.id, amountCents, creatorCents, platformCents, now);
  } catch (dbErr) {
    console.error('[stripe] Failed to persist PPV unlock record:', dbErr.message);
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amountCents: amountCents,
    creatorCents: creatorCents,
    platformCents: platformCents
  };
}

async function verifyPPVPayment(paymentIntentId, roomId, viewerId) {
  var stripe = getStripe();
  var db = getDb();

  var now = Math.floor(Date.now() / 1000);

  // Atomically claim the pending row so concurrent calls cannot both succeed.
  // SQLite's serialized write lock ensures exactly one UPDATE wins.
  // Also allow re-claiming rows stuck in 'verifying' for >5 min (server crash recovery).
  var claimed = db.prepare(
    "UPDATE ppv_unlocks SET status = 'verifying', completed_at = ? " +
    "WHERE payment_intent_id = ? AND (status = 'pending' OR (status = 'verifying' AND completed_at < ?))"
  ).run(now, paymentIntentId, now - 300);
  if (claimed.changes === 0) {
    throw new Error('Payment already redeemed or not found');
  }

  // Verify with Stripe; roll back the claimed row on any failure.
  var paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    db.prepare("UPDATE ppv_unlocks SET status = 'pending', completed_at = NULL WHERE payment_intent_id = ?").run(paymentIntentId);
    throw new Error('Failed to retrieve PaymentIntent: ' + err.message);
  }

  if (paymentIntent.status !== 'succeeded') {
    db.prepare("UPDATE ppv_unlocks SET status = 'pending', completed_at = NULL WHERE payment_intent_id = ?").run(paymentIntentId);
    throw new Error('Payment not succeeded. Current status: ' + paymentIntent.status);
  }

  if (paymentIntent.metadata.roomId !== roomId) {
    db.prepare("UPDATE ppv_unlocks SET status = 'pending', completed_at = NULL WHERE payment_intent_id = ?").run(paymentIntentId);
    throw new Error('PaymentIntent roomId mismatch');
  }
  if (paymentIntent.metadata.viewerId !== viewerId) {
    db.prepare("UPDATE ppv_unlocks SET status = 'pending', completed_at = NULL WHERE payment_intent_id = ?").run(paymentIntentId);
    throw new Error('PaymentIntent viewerId mismatch');
  }

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET env var is required');
  }

  var exp = now + 86400;
  var token = jwt.sign(
    {
      roomId: roomId,
      viewerId: viewerId,
      unlocked: true,
      exp: exp
    },
    process.env.JWT_SECRET
  );

  try {
    db.prepare("UPDATE ppv_unlocks SET status = 'succeeded' WHERE payment_intent_id = ?").run(paymentIntentId);
  } catch (dbErr) {
    console.error('[stripe] Failed to finalize PPV unlock status:', dbErr.message);
  }

  return { token: token };
}

async function handleStripeWebhook(rawBody, signature) {
  var stripe = getStripe();
  var db = getDb();

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET env var is required');
  }

  var event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new Error('Webhook signature verification failed: ' + err.message);
  }

  if (event.type === 'payment_intent.succeeded') {
    var pi = event.data.object;
    var now = Math.floor(Date.now() / 1000);
    try {
      db.prepare(`
        UPDATE ppv_unlocks
        SET status = 'succeeded', completed_at = ?
        WHERE payment_intent_id = ?
      `).run(now, pi.id);
    } catch (dbErr) {
      console.error('[stripe] Webhook DB update failed for PI ' + pi.id + ':', dbErr.message);
    }
    var pending = _pendingGiftCallbacks.get(pi.id);
    if (pending) {
      _pendingGiftCallbacks.delete(pi.id);
      try { pending.cb(); } catch (cbErr) {
        console.error('[stripe] Gift commit callback failed for PI ' + pi.id + ':', cbErr.message);
      }
    }
  }

  if (event.type === 'checkout.session.completed') {
    var tenantBilling = require('./tenantBilling');
    try {
      await tenantBilling.handleTenantCheckoutCompleted(event.data.object);
    } catch (err) {
      console.error('[stripe] tenant provisioning failed for session ' + event.data.object.id + ':', err.message);
    }
  }

  return { received: true };
}

async function createConnectAccount(email) {
  var stripe = getStripe();

  var account;
  try {
    account = await stripe.accounts.create({
      type: 'express',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual',
      metadata: {
        service: 'seewhy-live'
      }
    });
  } catch (err) {
    throw new Error('Failed to create Stripe Connect account: ' + err.message);
  }

  var origin = process.env.FRONTEND_ORIGIN || 'https://seewhylive.online';

  var accountLink;
  try {
    accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: origin + '/connect/refresh',
      return_url: origin + '/connect/return',
      type: 'account_onboarding'
    });
  } catch (err) {
    throw new Error('Failed to create Stripe account link: ' + err.message);
  }

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url
  };
}

async function createGiftCharge(fromViewerId, roomId, giftValueCents, creatorStripeAccountId) {
  var stripe = getStripe();

  var amountCents = Math.floor(giftValueCents);
  var creatorCents = Math.floor(amountCents * CREATOR);
  var platformCents = amountCents - creatorCents;

  var paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      application_fee_amount: platformCents,
      transfer_data: {
        destination: creatorStripeAccountId
      },
      metadata: {
        roomId: roomId,
        fromViewerId: fromViewerId,
        type: 'gift',
        service: 'seewhy-live'
      }
    });
  } catch (err) {
    throw new Error('Stripe gift charge creation failed: ' + err.message);
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amountCents: amountCents,
    creatorCents: creatorCents,
    platformCents: platformCents
  };
}

function registerPaymentCallback(paymentIntentId, cb) {
  _pendingGiftCallbacks.set(String(paymentIntentId), { cb: cb, expiresAt: Date.now() + _GIFT_CB_TTL_MS });
}

module.exports = {
  createPPVPaymentIntent: createPPVPaymentIntent,
  getStripe: getStripe,
  verifyPPVPayment: verifyPPVPayment,
  handleStripeWebhook: handleStripeWebhook,
  createConnectAccount: createConnectAccount,
  createGiftCharge: createGiftCharge,
  registerPaymentCallback: registerPaymentCallback,
};
