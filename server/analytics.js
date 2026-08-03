'use strict';

var Database = require('better-sqlite3');
var { v4: uuidv4 } = require('uuid');

var CREATOR = 0.90;
var PLATFORM = 0.10;

var DB_PATH = process.env.DB_PATH || '/opt/seewhy/data/seewhy.db';

var db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(
  'CREATE TABLE IF NOT EXISTS stream_analytics (' +
  '  id TEXT PRIMARY KEY,' +
  '  stream_id TEXT NOT NULL,' +
  '  host_id TEXT NOT NULL,' +
  '  event_type TEXT NOT NULL,' +
  '  viewer_count INTEGER DEFAULT 0,' +
  '  earnings_cents INTEGER DEFAULT 0,' +
  '  recorded_at INTEGER NOT NULL' +
  ');'
);

db.exec(
  'CREATE TABLE IF NOT EXISTS creator_earnings (' +
  '  id TEXT PRIMARY KEY,' +
  '  creator_id TEXT NOT NULL,' +
  '  stream_id TEXT,' +
  '  payment_type TEXT NOT NULL CHECK(payment_type IN (\'tip\',\'subscription\',\'paywall\',\'gift\',\'payout\')),' +
  '  amount_cents INTEGER NOT NULL,' +
  '  creator_cents INTEGER NOT NULL,' +
  '  platform_cents INTEGER NOT NULL,' +
  '  note TEXT,' +
  '  created_at INTEGER NOT NULL' +
  ');'
);

db.exec(
  'CREATE TABLE IF NOT EXISTS viewer_sessions (' +
  '  id TEXT PRIMARY KEY,' +
  '  stream_id TEXT NOT NULL,' +
  '  user_id TEXT NOT NULL,' +
  '  joined_at INTEGER NOT NULL,' +
  '  left_at INTEGER,' +
  '  duration_seconds INTEGER DEFAULT 0' +
  ');'
);

var stmtInsertStreamEvent = db.prepare(
  'INSERT INTO stream_analytics (id, stream_id, host_id, event_type, viewer_count, earnings_cents, recorded_at)' +
  ' VALUES (?, ?, ?, ?, ?, ?, ?)'
);

var stmtInsertEarning = db.prepare(
  'INSERT INTO creator_earnings (id, creator_id, stream_id, payment_type, amount_cents, creator_cents, platform_cents, note, created_at)' +
  ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

var stmtInsertSession = db.prepare(
  'INSERT INTO viewer_sessions (id, stream_id, user_id, joined_at, left_at, duration_seconds)' +
  ' VALUES (?, ?, ?, ?, NULL, 0)'
);

var stmtEndSession = db.prepare(
  'UPDATE viewer_sessions SET left_at = ?, duration_seconds = CAST((? - joined_at) / 1000 AS INTEGER)' +
  ' WHERE stream_id = ? AND user_id = ? AND left_at IS NULL'
);

function recordStreamEvent(streamId, hostId, eventType, viewerCount, earningsCents) {
  var id = uuidv4();
  var now = Date.now();
  stmtInsertStreamEvent.run(id, streamId, hostId, eventType, viewerCount || 0, earningsCents || 0, now);
}

function recordEarning(creatorId, streamId, paymentType, amountCents, note) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('recordEarning: invalid amountCents ' + amountCents);
  }
  var id = uuidv4();
  var now = Date.now();
  var creatorCents = Math.floor(amountCents * CREATOR);
  var platformCents = amountCents - creatorCents;
  stmtInsertEarning.run(id, creatorId, streamId || null, paymentType, amountCents, creatorCents, platformCents, note || null, now);
}

function recordViewerSession(streamId, userId, joinedAt) {
  var id = uuidv4();
  stmtInsertSession.run(id, streamId, userId, joinedAt);
}

function endViewerSession(streamId, userId, leftAt) {
  if (!Number.isInteger(leftAt) || leftAt <= 0) return;
  stmtEndSession.run(leftAt, leftAt, streamId, userId);
}

function _getPeriodStart(period) {
  var now = Date.now();
  if (period === 'today') {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (period === 'week') {
    return now - 7 * 24 * 60 * 60 * 1000;
  }
  if (period === 'month') {
    return now - 30 * 24 * 60 * 60 * 1000;
  }
  throw new Error('_getPeriodStart: unknown period "' + period + '"');
}

function getCreatorAnalytics(creatorId, period) {
  var periodStart = _getPeriodStart(period);

  var totalsRow = db.prepare(
    'SELECT' +
    '  SUM(amount_cents) AS total,' +
    '  SUM(creator_cents) AS creator,' +
    '  SUM(platform_cents) AS platform' +
    ' FROM creator_earnings' +
    ' WHERE creator_id = ? AND created_at >= ?'
  ).get(creatorId, periodStart);

  var totalEarningsCents = Math.floor(totalsRow.total || 0);
  var creatorCents = Math.floor(totalsRow.creator || 0);
  var platformCents = Math.floor(totalsRow.platform || 0);

  var typeRows = db.prepare(
    'SELECT payment_type, SUM(creator_cents) AS total' +
    ' FROM creator_earnings' +
    ' WHERE creator_id = ? AND created_at >= ?' +
    ' GROUP BY payment_type'
  ).all(creatorId, periodStart);

  var byType = { tip: 0, subscription: 0, paywall: 0, gift: 0 };
  for (var i = 0; i < typeRows.length; i++) {
    var t = typeRows[i];
    if (byType.hasOwnProperty(t.payment_type)) {
      byType[t.payment_type] = Math.floor(t.total || 0);
    }
  }

  var recentEarnings = db.prepare(
    'SELECT * FROM creator_earnings' +
    ' WHERE creator_id = ?' +
    ' ORDER BY created_at DESC LIMIT 50'
  ).all(creatorId);

  var topSupporters = db.prepare(
    'SELECT user_id, SUM(amount_cents) AS total_cents, COUNT(*) AS count' +
    ' FROM (' +
    '   SELECT vs.user_id, ce.amount_cents' +
    '   FROM creator_earnings ce' +
    '   JOIN viewer_sessions vs ON vs.stream_id = ce.stream_id' +
    '   WHERE ce.creator_id = ? AND ce.created_at >= ?' +
    ' )' +
    ' GROUP BY user_id' +
    ' ORDER BY total_cents DESC' +
    ' LIMIT 10'
  ).all(creatorId, periodStart);

  var topSupportersMapped = [];
  for (var j = 0; j < topSupporters.length; j++) {
    topSupportersMapped.push({
      userId: topSupporters[j].user_id,
      totalCents: Math.floor(topSupporters[j].total_cents || 0),
      count: topSupporters[j].count
    });
  }

  var streamStatsRows = db.prepare(
    'SELECT stream_id,' +
    '  MAX(viewer_count) AS peak,' +
    '  AVG(viewer_count) AS avg_viewers' +
    ' FROM stream_analytics' +
    ' WHERE host_id = ? AND recorded_at >= ?' +
    ' GROUP BY stream_id'
  ).all(creatorId, periodStart);

  var streamCount = streamStatsRows.length;
  var totalAvg = 0;
  var peakViewers = 0;
  for (var k = 0; k < streamStatsRows.length; k++) {
    totalAvg += streamStatsRows[k].avg_viewers || 0;
    if (streamStatsRows[k].peak > peakViewers) {
      peakViewers = streamStatsRows[k].peak;
    }
  }
  var avgViewersPerStream = streamCount > 0 ? Math.floor(totalAvg / streamCount) : 0;

  return {
    totalEarningsCents: totalEarningsCents,
    creatorCents: creatorCents,
    platformCents: platformCents,
    byType: byType,
    recentEarnings: recentEarnings,
    topSupporters: topSupportersMapped,
    streamCount: streamCount,
    avgViewersPerStream: avgViewersPerStream,
    peakViewers: peakViewers
  };
}

function getStreamAnalytics(streamId) {
  var earningsRow = db.prepare(
    'SELECT' +
    '  SUM(amount_cents) AS total,' +
    '  SUM(creator_cents) AS creator,' +
    '  SUM(platform_cents) AS platform' +
    ' FROM creator_earnings WHERE stream_id = ?'
  ).get(streamId);

  var viewersRow = db.prepare(
    'SELECT' +
    '  COUNT(DISTINCT user_id) AS unique_viewers,' +
    '  MAX(viewer_count) AS peak_viewers,' +
    '  AVG(viewer_count) AS avg_viewers' +
    ' FROM stream_analytics WHERE stream_id = ?'
  ).get(streamId);

  var events = db.prepare(
    'SELECT * FROM stream_analytics WHERE stream_id = ? ORDER BY recorded_at ASC'
  ).all(streamId);

  return {
    streamId: streamId,
    totalEarningsCents: Math.floor((earningsRow && earningsRow.total) || 0),
    creatorCents: Math.floor((earningsRow && earningsRow.creator) || 0),
    platformCents: Math.floor((earningsRow && earningsRow.platform) || 0),
    uniqueViewers: (viewersRow && viewersRow.unique_viewers) || 0,
    peakViewers: (viewersRow && viewersRow.peak_viewers) || 0,
    avgViewers: Math.floor((viewersRow && viewersRow.avg_viewers) || 0),
    events: events
  };
}

function getPlatformMetrics() {
  var revenueRow = db.prepare(
    'SELECT' +
    '  SUM(amount_cents) AS total_revenue,' +
    '  SUM(platform_cents) AS platform_cut' +
    ' FROM creator_earnings'
  ).get();

  var creatorCount = db.prepare(
    'SELECT COUNT(DISTINCT creator_id) AS cnt FROM creator_earnings'
  ).get();

  var streamCount = db.prepare(
    'SELECT COUNT(DISTINCT stream_id) AS cnt FROM stream_analytics'
  ).get();

  return {
    totalRevenueCents: Math.floor((revenueRow && revenueRow.total_revenue) || 0),
    platformCutCents: Math.floor((revenueRow && revenueRow.platform_cut) || 0),
    totalCreators: (creatorCount && creatorCount.cnt) || 0,
    totalStreams: (streamCount && streamCount.cnt) || 0
  };
}

function getTopCreators(limit) {
  var n = Math.min(limit || 20, 100);
  var rows = db.prepare(
    'SELECT creator_id, SUM(creator_cents) AS total_cents, COUNT(*) AS txn_count' +
    ' FROM creator_earnings' +
    ' GROUP BY creator_id' +
    ' ORDER BY total_cents DESC' +
    ' LIMIT ?'
  ).all(n);
  return (rows || []).map(function(r) {
    return {
      creatorId: r.creator_id,
      totalCents: Math.floor(r.total_cents || 0),
      txnCount: r.txn_count || 0
    };
  });
}

module.exports = {
  recordStreamEvent: recordStreamEvent,
  recordEarning: recordEarning,
  recordViewerSession: recordViewerSession,
  endViewerSession: endViewerSession,
  getCreatorAnalytics: getCreatorAnalytics,
  getStreamAnalytics: getStreamAnalytics,
  getPlatformMetrics: getPlatformMetrics,
  getTopCreators: getTopCreators
};
