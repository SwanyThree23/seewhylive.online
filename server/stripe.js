'use strict';

/**
 * stripe.js - Stripe Connect + PPV payments for SeeWhy LIVE v33.0
 * All monetary values are INTEGER cents. Math.floor() on every calculation.
 * Split is immutable: CREATOR 90%, PLATFORM 10%.
 */

const Stripe = require('stripe');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

// ─── Immutable revenue split ──────────────────────────────────────────────
const CREATOR = 0.90;
const PLATFORM = 0.10; // eslint-disable-line no-unused-vars

// ─── Stripe client ────────────────────────────────────────────────────────
let stripeClient = null;

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
let _db = null;

function getDb() {
  if (!_db) {
    const dbPath = process.env.DB_PATH || '/opt/seewhy/data/seewhy.db';
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

// ─── createPPVPaymentIntent ───────────────────────────────────────────────

/**
 * Create a Stripe PaymentIntent for a pay-per-view room access purchase.
 * Uses Stripe Connect transfer_data so creator receives 90% automatically.
 *
 * @param {string} roomId
 * @param {string} viewerId
 * @param {number} priceUsd - price in USD dollars (e.g. 4.99)
 * @param {string} creatorStripeAccountId - Stripe Connect account ID
 * @returns {Promise<{clientSecret: string, paymentIntentId: string, amountCents: number, creatorCents: number, platformCents: number}>}
 */
async function createPPVPaymentIntent(roomId, viewerId, priceUsd, creatorStripeAccountId) {
  const stripe = getStripe();
  const db = getDb();

  const amountCents = Math.floor(priceUsd * 100);
  const creatorCents = Math.floor(amountCents * CREATOR);
  const platformCents = amountCents - creatorCents;

  let paymentIntent;
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

  const id = paymentIntent.id + '_' + Math.floor(Date.now() / 1000);
  const now = Math.floor(Date.now() / 1000);

  try {
    db.prepare(`
      INSERT OR IGNORE INTO ppv_unlocks
        (id, room_id, viewer_id, payment_intent_id, amount_cents, creator_cents, platform_cents, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(id, roomId, viewerId, paymentIntent.id, amountCents, creatorCents, platformCents, now);
  } catch (dbErr) {
    // DB insert failure should not block the client from completing payment
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

// ─── verifyPPVPayment ─────────────────────────────────────────────────────

/**
 * Verify a completed PPV PaymentIntent and issue a JWT access token.
 *
 * @param {string} paymentIntentId
 * @param {string} roomId
 * @param {string} viewerId
 * @returns {Promise<{token: string}>}
 */
async function verifyPPVPayment(paymentIntentId, roomId, viewerId) {
  const stripe = getStripe();
  const db = getDb();

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    throw new Error('Failed to retrieve PaymentIntent: ' + err.message);
  }

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment not succeeded. Current status: ' + paymentIntent.status);
  }

  if (paymentIntent.metadata.roomId !== roomId) {
    throw new Error('PaymentIntent roomId mismatch');
  }
  if (paymentIntent.metadata.viewerId !== viewerId) {
    throw new Error('PaymentIntent viewerId mismatch');
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 86400;

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET env var is required');
  }

  const token = jwt.sign(
    {
      roomId: roomId,
      viewerId: viewerId,
      unlocked: true,
      exp: exp
    },
    process.env.JWT_SECRET
  );

  try {
    db.prepare(`
      UPDATE ppv_unlocks
      SET status = 'succeeded', completed_at = ?
      WHERE payment_intent_id = ?
    `).run(now, paymentIntentId);
  } catch (dbErr) {
    console.error('[stripe] Failed to update PPV unlock status:', dbErr.message);
  }

  return { token: token };
}

// ─── handleStripeWebhook ──────────────────────────────────────────────────

/**
 * Verify and process an incoming Stripe webhook event.
 * Handles payment_intent.succeeded to update ppv_unlocks.
 *
 * @param {Buffer} rawBody
 * @param {string} signature
 * @returns {Promise<{received: boolean}>}
 */
async function handleStripeWebhook(rawBody, signature) {
  const stripe = getStripe();
  const db = getDb();

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET env var is required');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new Error('Webhook signature verification failed: ' + err.message);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const now = Math.floor(Date.now() / 1000);
    try {
      db.prepare(`
        UPDATE ppv_unlocks
        SET status = 'succeeded', completed_at = ?
        WHERE payment_intent_id = ?
      `).run(now, pi.id);
    } catch (dbErr) {
      console.error('[stripe] Webhook DB update failed for PI ' + pi.id + ':', dbErr.message);
    }
  }

  return { received: true };
}

// ─── createConnectAccount ─────────────────────────────────────────────────

/**
 * Create a Stripe Connect Express account and return the onboarding URL.
 *
 * @param {string} email
 * @returns {Promise<{accountId: string, onboardingUrl: string}>}
 */
async function createConnectAccount(email) {
  const stripe = getStripe();

  let account;
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

  const origin = process.env.FRONTEND_ORIGIN || 'https://seewhylive.online';

  let accountLink;
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

// ─── createGiftCharge ─────────────────────────────────────────────────────

/**
 * Create a Stripe PaymentIntent for a gift/tip during a live stream.
 * Returns params for the frontend to complete payment.
 * Same 90/10 split as PPV.
 *
 * @param {string} fromViewerId
 * @param {string} roomId
 * @param {number} giftValueCents - integer cents
 * @param {string} creatorStripeAccountId
 * @returns {Promise<{clientSecret: string, paymentIntentId: string, amountCents: number, creatorCents: number, platformCents: number}>}
 */
async function createGiftCharge(fromViewerId, roomId, giftValueCents, creatorStripeAccountId) {
  const stripe = getStripe();

  const amountCents = Math.floor(giftValueCents);
  const creatorCents = Math.floor(amountCents * CREATOR);
  const platformCents = amountCents - creatorCents;

  let paymentIntent;
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

// ─── Exports ──────────────────────────────────────────────────────────────
module.exports = {
  createPPVPaymentIntent: createPPVPaymentIntent,
  verifyPPVPayment: verifyPPVPayment,
  handleStripeWebhook: handleStripeWebhook,
  createConnectAccount: createConnectAccount,
  createGiftCharge: createGiftCharge
};
