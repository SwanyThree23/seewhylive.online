'use strict';

var Database = require('better-sqlite3');
var { v4: uuidv4 } = require('uuid');

var DB_PATH = process.env.DB_PATH || '/opt/seewhy/data/seewhy.db';

var db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(
  'CREATE TABLE IF NOT EXISTS creator_bans (' +
  '  id TEXT PRIMARY KEY,' +
  '  creator_id TEXT NOT NULL,' +
  '  banned_user_id TEXT NOT NULL,' +
  '  banned_username TEXT NOT NULL,' +
  '  reason TEXT,' +
  '  created_at INTEGER NOT NULL,' +
  '  UNIQUE(creator_id, banned_user_id)' +
  ');'
);

db.exec(
  'CREATE TABLE IF NOT EXISTS word_filters (' +
  '  id TEXT PRIMARY KEY,' +
  '  creator_id TEXT NOT NULL,' +
  '  word TEXT NOT NULL,' +
  '  created_at INTEGER NOT NULL,' +
  '  UNIQUE(creator_id, word)' +
  ');'
);

db.exec(
  'CREATE TABLE IF NOT EXISTS subscriber_only_rooms (' +
  '  room_id TEXT PRIMARY KEY,' +
  '  creator_id TEXT NOT NULL,' +
  '  enabled INTEGER NOT NULL DEFAULT 0,' +
  '  created_at INTEGER NOT NULL' +
  ');'
);

db.exec(
  'CREATE TABLE IF NOT EXISTS subscriptions (' +
  '  id TEXT PRIMARY KEY,' +
  '  subscriber_id TEXT NOT NULL,' +
  '  creator_id TEXT NOT NULL,' +
  '  tier TEXT NOT NULL CHECK(tier IN (\'fan\',\'supporter\',\'ride_or_die\')),' +
  '  amount_cents INTEGER NOT NULL,' +
  '  status TEXT NOT NULL DEFAULT \'active\',' +
  '  stripe_subscription_id TEXT UNIQUE,' +
  '  current_period_end INTEGER,' +
  '  created_at INTEGER NOT NULL,' +
  '  updated_at INTEGER NOT NULL' +
  ');'
);

db.exec(
  'CREATE TABLE IF NOT EXISTS shadow_bans (' +
  '  user_id TEXT PRIMARY KEY,' +
  '  reason TEXT,' +
  '  banned_by TEXT,' +
  '  created_at INTEGER NOT NULL' +
  ');'
);

var stmtInsertBan = db.prepare(
  'INSERT OR REPLACE INTO creator_bans (id, creator_id, banned_user_id, banned_username, reason, created_at)' +
  ' VALUES (?, ?, ?, ?, ?, ?)'
);

var stmtDeleteBan = db.prepare(
  'DELETE FROM creator_bans WHERE creator_id = ? AND banned_user_id = ?'
);

var stmtIsBanned = db.prepare(
  'SELECT 1 FROM creator_bans WHERE creator_id = ? AND banned_user_id = ? LIMIT 1'
);

var stmtGetBanned = db.prepare(
  'SELECT * FROM creator_bans WHERE creator_id = ? ORDER BY created_at DESC'
);

var stmtInsertWord = db.prepare(
  'INSERT OR REPLACE INTO word_filters (id, creator_id, word, created_at) VALUES (?, ?, ?, ?)'
);

var stmtDeleteWord = db.prepare(
  'DELETE FROM word_filters WHERE creator_id = ? AND word = ?'
);

var stmtDeleteWordById = db.prepare(
  'DELETE FROM word_filters WHERE creator_id = ? AND id = ?'
);

var stmtGetWords = db.prepare(
  'SELECT id, word FROM word_filters WHERE creator_id = ?'
);

var stmtUpsertRoom = db.prepare(
  'INSERT INTO subscriber_only_rooms (room_id, creator_id, enabled, created_at)' +
  ' VALUES (?, ?, ?, ?)' +
  ' ON CONFLICT(room_id) DO UPDATE SET enabled = excluded.enabled'
);

var stmtIsSubscriberOnly = db.prepare(
  'SELECT enabled FROM subscriber_only_rooms WHERE room_id = ? LIMIT 1'
);

var stmtIsSubscribed = db.prepare(
  'SELECT 1 FROM subscriptions WHERE subscriber_id = ? AND creator_id = ? AND status = \'active\' LIMIT 1'
);

var stmtInsertShadowBan = db.prepare(
  'INSERT OR REPLACE INTO shadow_bans (user_id, reason, banned_by, created_at) VALUES (?, ?, ?, ?)'
);

var stmtIsShadowBanned = db.prepare(
  'SELECT 1 FROM shadow_bans WHERE user_id = ? LIMIT 1'
);

var stmtGetShadowBans = db.prepare(
  'SELECT * FROM shadow_bans ORDER BY created_at DESC'
);

var stmtInsertSubscription = db.prepare(
  'INSERT INTO subscriptions (id, subscriber_id, creator_id, tier, amount_cents, status, stripe_subscription_id, current_period_end, created_at, updated_at)' +
  ' VALUES (?, ?, ?, ?, ?, \'active\', ?, NULL, ?, ?)'
);

var stmtGetSubscribers = db.prepare(
  'SELECT * FROM subscriptions WHERE creator_id = ? AND status = \'active\' ORDER BY created_at DESC'
);

function banUser(creatorId, bannedUserId, bannedUsername, reason) {
  var id = uuidv4();
  var now = Date.now();
  stmtInsertBan.run(id, creatorId, bannedUserId, bannedUsername, reason || null, now);
  return { id: id, creatorId: creatorId, bannedUserId: bannedUserId };
}

function unbanUser(creatorId, bannedUserId) {
  stmtDeleteBan.run(creatorId, bannedUserId);
}

function isUserBanned(creatorId, userId) {
  var row = stmtIsBanned.get(creatorId, userId);
  return !!row;
}

function getBannedUsers(creatorId) {
  return stmtGetBanned.all(creatorId);
}

function addWordFilter(creatorId, word) {
  var normalised = String(word || '').trim().toLowerCase();
  if (!normalised || normalised.length > 100) {
    throw new Error('addWordFilter: word must be 1–100 characters');
  }
  var id = uuidv4();
  var now = Date.now();
  stmtInsertWord.run(id, creatorId, normalised, now);
  return { id: id, word: normalised };
}

function removeWordFilter(creatorId, word) {
  stmtDeleteWord.run(creatorId, word.toLowerCase());
}

function removeWordFilterById(creatorId, id) {
  stmtDeleteWordById.run(creatorId, id);
}

function getWordFilters(creatorId) {
  return stmtGetWords.all(creatorId);
}

function containsBannedWord(creatorId, messageText) {
  var words = stmtGetWords.all(creatorId);
  var lower = messageText.toLowerCase();
  for (var i = 0; i < words.length; i++) {
    if (lower.indexOf(words[i].word) !== -1) {
      return { blocked: true, matchedWord: words[i].word };
    }
  }
  return { blocked: false, matchedWord: null };
}

function setSubscriberOnly(roomId, creatorId, enabled) {
  var now = Date.now();
  stmtUpsertRoom.run(roomId, creatorId, enabled ? 1 : 0, now);
}

function isSubscriberOnly(roomId) {
  var row = stmtIsSubscriberOnly.get(roomId);
  if (!row) return false;
  return row.enabled === 1;
}

function isSubscribed(subscriberId, creatorId) {
  var row = stmtIsSubscribed.get(subscriberId, creatorId);
  return !!row;
}

function shadowBanUser(userId, reason, bannedBy) {
  var now = Date.now();
  stmtInsertShadowBan.run(userId, reason || null, bannedBy || null, now);
}

function isShadowBanned(userId) {
  var row = stmtIsShadowBanned.get(userId);
  return !!row;
}

function getShadowBans() {
  return stmtGetShadowBans.all();
}

function addSubscription(id, subscriberId, creatorId, tier, amountCents, stripeSubId) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('addSubscription: invalid amountCents ' + amountCents);
  }
  var now = Date.now();
  stmtInsertSubscription.run(id, subscriberId, creatorId, tier, amountCents, stripeSubId || null, now, now);
}

function getSubscribers(creatorId) {
  return stmtGetSubscribers.all(creatorId);
}

module.exports = {
  banUser: banUser,
  unbanUser: unbanUser,
  isUserBanned: isUserBanned,
  getBannedUsers: getBannedUsers,
  addWordFilter: addWordFilter,
  removeWordFilter: removeWordFilter,
  removeWordFilterById: removeWordFilterById,
  getWordFilters: getWordFilters,
  containsBannedWord: containsBannedWord,
  setSubscriberOnly: setSubscriberOnly,
  isSubscriberOnly: isSubscriberOnly,
  isSubscribed: isSubscribed,
  shadowBanUser: shadowBanUser,
  isShadowBanned: isShadowBanned,
  getShadowBans: getShadowBans,
  addSubscription: addSubscription,
  getSubscribers: getSubscribers
};
