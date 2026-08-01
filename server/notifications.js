'use strict';

var Database = require('better-sqlite3');
var axios = require('axios');

var DB_PATH = process.env.DB_PATH || '/opt/seewhy/data/seewhy.db';

var db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(
  'CREATE TABLE IF NOT EXISTS push_subscriptions (' +
  '  user_id TEXT PRIMARY KEY,' +
  '  subscription_json TEXT NOT NULL,' +
  '  updated_at INTEGER NOT NULL' +
  ');'
);

var _pushSubscriptions = {};

var webPush = null;
try {
  webPush = require('web-push');
} catch (e) {
  console.warn('[notifications] web-push not installed — push notifications disabled');
}

var RESEND_API_URL = 'https://api.resend.com/emails';
var FROM_ADDRESS = 'SeeWhy LIVE <noreply@seewhylive.online>';

function _sendEmail(toEmail, subject, html) {
  return new Promise(function(resolve, reject) {
    var apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[notifications] RESEND_API_KEY not set — skipping email to ' + toEmail);
      resolve(null);
      return;
    }
    axios.post(RESEND_API_URL, {
      from: FROM_ADDRESS,
      to: [toEmail],
      subject: subject,
      html: html
    }, {
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      }
    }).then(function(res) {
      resolve(res.data);
    }).catch(function(err) {
      console.error('[notifications] Email send failed: ' + (err.message || err));
      reject(err);
    });
  });
}

function _formatDollars(amountCents) {
  var dollars = Math.floor(amountCents) / 100;
  var str = dollars.toFixed(2);
  return '$' + str;
}

function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _safeUrl(url) {
  return typeof url === 'string' && url.startsWith('https://') ? _esc(url) : '#';
}

function sendWelcomeEmail(toEmail, displayName) {
  var safeName = _esc(displayName);
  var subject = 'Welcome to SeeWhy LIVE, ' + safeName + '!';
  var html =
    '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">' +
    '<h1 style="color:#7c3aed;">Welcome to SeeWhy LIVE!</h1>' +
    '<p>Hey ' + safeName + ',</p>' +
    '<p>We\'re thrilled to have you join the SeeWhy LIVE community. ' +
    'Start exploring live streams, connect with creators, and share your own moments.</p>' +
    '<p>Happy watching (and streaming)!</p>' +
    '<p>— The SeeWhy LIVE Team</p>' +
    '</div>';
  return _sendEmail(toEmail, subject, html);
}

function sendStreamStartEmail(toEmail, viewerName, creatorName, streamTitle, streamUrl) {
  var safeViewer  = _esc(viewerName);
  var safeCreator = _esc(creatorName);
  var safeTitle   = _esc(streamTitle);
  var safeUrl     = _safeUrl(streamUrl);
  var subject = '🔴 ' + safeCreator + ' is LIVE now!';
  var html =
    '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">' +
    '<h1 style="color:#ef4444;">🔴 ' + safeCreator + ' just went LIVE!</h1>' +
    '<p>Hey ' + safeViewer + ',</p>' +
    '<p><strong>' + safeCreator + '</strong> is streaming now: <em>' + safeTitle + '</em></p>' +
    '<p><a href="' + safeUrl + '" style="background:#7c3aed;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Watch Now</a></p>' +
    '<p>— The SeeWhy LIVE Team</p>' +
    '</div>';
  return _sendEmail(toEmail, subject, html);
}

function sendPayoutEmail(toEmail, displayName, amountCents) {
  var safeName  = _esc(displayName);
  var formatted = _formatDollars(amountCents);
  var subject = 'Your payout of ' + formatted + ' has been processed';
  var html =
    '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">' +
    '<h1 style="color:#059669;">Payout Processed!</h1>' +
    '<p>Hey ' + safeName + ',</p>' +
    '<p>Your payout of <strong>' + _esc(formatted) + '</strong> has been processed and is on its way.</p>' +
    '<p>Thank you for creating amazing content on SeeWhy LIVE!</p>' +
    '<p>— The SeeWhy LIVE Team</p>' +
    '</div>';
  return _sendEmail(toEmail, subject, html);
}

function sendSubscriptionEmail(toEmail, displayName, creatorName, tier, amountCents) {
  var safeName    = _esc(displayName);
  var safeCreator = _esc(creatorName);
  var safeTier    = _esc(tier);
  var formatted   = _formatDollars(amountCents);
  var subject = 'You\'re subscribed to ' + safeCreator + '!';
  var html =
    '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">' +
    '<h1 style="color:#7c3aed;">Subscription Confirmed!</h1>' +
    '<p>Hey ' + safeName + ',</p>' +
    '<p>You are now subscribed to <strong>' + safeCreator + '</strong> at the ' +
    '<strong>' + safeTier + '</strong> tier for <strong>' + _esc(formatted) + '/month</strong>.</p>' +
    '<p>Enjoy exclusive perks and support your favourite creator!</p>' +
    '<p>— The SeeWhy LIVE Team</p>' +
    '</div>';
  return _sendEmail(toEmail, subject, html);
}

function sendWeeklyDigest(toEmail, displayName, stats) {
  var safeName     = _esc(displayName);
  var subject = 'Your SeeWhy LIVE week in review';
  var earnings = _formatDollars(stats.totalEarningsCents || 0);
  var newFollowers = stats.newFollowers || 0;
  var peakViewers = stats.peakViewers || 0;
  var html =
    '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">' +
    '<h1 style="color:#7c3aed;">Your Week in Review</h1>' +
    '<p>Hey ' + safeName + ', here\'s how your week looked on SeeWhy LIVE:</p>' +
    '<table style="width:100%;border-collapse:collapse;">' +
    '<tr style="background:#f3f4f6;"><td style="padding:12px;">Total Earnings</td><td style="padding:12px;font-weight:bold;">' + _esc(earnings) + '</td></tr>' +
    '<tr><td style="padding:12px;">New Followers</td><td style="padding:12px;font-weight:bold;">' + parseInt(newFollowers, 10) + '</td></tr>' +
    '<tr style="background:#f3f4f6;"><td style="padding:12px;">Peak Viewers</td><td style="padding:12px;font-weight:bold;">' + parseInt(peakViewers, 10) + '</td></tr>' +
    '</table>' +
    '<p>Keep up the great work — see you next week!</p>' +
    '<p>— The SeeWhy LIVE Team</p>' +
    '</div>';
  return _sendEmail(toEmail, subject, html);
}

function setVAPIDKeys(publicKey, privateKey, subject) {
  if (!webPush) {
    console.warn('[notifications] web-push not available — cannot set VAPID keys');
    return;
  }
  try {
    webPush.setVapidDetails(subject, publicKey, privateKey);
  } catch (e) {
    console.error('[notifications] setVapidDetails error: ' + e.message);
  }
}

function sendPushNotification(subscription, title, body, data) {
  return new Promise(function(resolve, reject) {
    if (!webPush) {
      console.warn('[notifications] web-push not available — push skipped');
      resolve(null);
      return;
    }
    var payload = JSON.stringify({ title: title, body: body, data: data || {} });
    try {
      webPush.sendNotification(subscription, payload).then(function(result) {
        resolve(result);
      }).catch(function(err) {
        console.error('[notifications] Push send error: ' + err.message);
        reject(err);
      });
    } catch (e) {
      console.error('[notifications] Push exception: ' + e.message);
      reject(e);
    }
  });
}

var stmtUpsertPushSub = db.prepare(
  'INSERT INTO push_subscriptions (user_id, subscription_json, updated_at)' +
  ' VALUES (?, ?, ?)' +
  ' ON CONFLICT(user_id) DO UPDATE SET subscription_json = excluded.subscription_json, updated_at = excluded.updated_at'
);

function subscribeToNotifications(userId, pushSubscription) {
  _pushSubscriptions[userId] = pushSubscription;
  var now = Date.now();
  try {
    stmtUpsertPushSub.run(userId, JSON.stringify(pushSubscription), now);
  } catch (e) {
    console.error('[notifications] DB push subscription save error: ' + e.message);
  }
}

module.exports = {
  sendWelcomeEmail: sendWelcomeEmail,
  sendStreamStartEmail: sendStreamStartEmail,
  sendPayoutEmail: sendPayoutEmail,
  sendSubscriptionEmail: sendSubscriptionEmail,
  sendWeeklyDigest: sendWeeklyDigest,
  setVAPIDKeys: setVAPIDKeys,
  sendPushNotification: sendPushNotification,
  subscribeToNotifications: subscribeToNotifications
};
