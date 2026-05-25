'use strict';

var Database = require('better-sqlite3');

var DB_PATH = process.env.DB_PATH || '/opt/seewhy/data/seewhy.db';

var db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(
  'CREATE TABLE IF NOT EXISTS stream_index (' +
  '  stream_id TEXT PRIMARY KEY,' +
  '  title TEXT,' +
  '  description TEXT,' +
  '  host_username TEXT,' +
  '  host_display_name TEXT,' +
  '  genre TEXT,' +
  '  status TEXT,' +
  '  viewer_count INTEGER DEFAULT 0,' +
  '  created_at INTEGER' +
  ');'
);

db.exec(
  'CREATE VIRTUAL TABLE IF NOT EXISTS stream_fts USING fts5(' +
  '  title, description, host_username, host_display_name, genre,' +
  '  content=\'stream_index\', content_rowid=\'rowid\'' +
  ');'
);

db.exec(
  'CREATE TABLE IF NOT EXISTS creator_index (' +
  '  user_id TEXT PRIMARY KEY,' +
  '  username TEXT,' +
  '  display_name TEXT,' +
  '  bio TEXT,' +
  '  is_live INTEGER DEFAULT 0,' +
  '  follower_count INTEGER DEFAULT 0' +
  ');'
);

db.exec(
  'CREATE VIRTUAL TABLE IF NOT EXISTS creator_fts USING fts5(' +
  '  username, display_name, bio,' +
  '  content=\'creator_index\', content_rowid=\'rowid\'' +
  ');'
);

var stmtUpsertStream = db.prepare(
  'INSERT INTO stream_index (stream_id, title, description, host_username, host_display_name, genre, status, viewer_count, created_at)' +
  ' VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)' +
  ' ON CONFLICT(stream_id) DO UPDATE SET' +
  '   title = excluded.title,' +
  '   description = excluded.description,' +
  '   host_username = excluded.host_username,' +
  '   host_display_name = excluded.host_display_name,' +
  '   genre = excluded.genre,' +
  '   status = excluded.status,' +
  '   viewer_count = excluded.viewer_count'
);

var stmtRebuildStreamFts = db.prepare(
  'INSERT INTO stream_fts(stream_fts) VALUES(\'rebuild\')'
);

var stmtUpdateStreamStatus = db.prepare(
  'UPDATE stream_index SET status = ?, viewer_count = ? WHERE stream_id = ?'
);

var stmtUpsertCreator = db.prepare(
  'INSERT INTO creator_index (user_id, username, display_name, bio, is_live, follower_count)' +
  ' VALUES (?, ?, ?, ?, ?, ?)' +
  ' ON CONFLICT(user_id) DO UPDATE SET' +
  '   username = excluded.username,' +
  '   display_name = excluded.display_name,' +
  '   bio = excluded.bio,' +
  '   is_live = excluded.is_live,' +
  '   follower_count = excluded.follower_count'
);

var stmtRebuildCreatorFts = db.prepare(
  'INSERT INTO creator_fts(creator_fts) VALUES(\'rebuild\')'
);

function indexStream(streamId, title, desc, hostUsername, hostDisplayName, genre, status, viewerCount) {
  var now = Date.now();
  stmtUpsertStream.run(streamId, title, desc, hostUsername, hostDisplayName, genre, status, viewerCount || 0, now);
  stmtRebuildStreamFts.run();
}

function updateStreamStatus(streamId, status, viewerCount) {
  stmtUpdateStreamStatus.run(status, viewerCount || 0, streamId);
}

function indexCreator(userId, username, displayName, bio, isLive, followerCount) {
  stmtUpsertCreator.run(userId, username, displayName, bio, isLive ? 1 : 0, followerCount || 0);
  stmtRebuildCreatorFts.run();
}

function searchStreams(query, limit) {
  var maxRows = limit || 20;
  var stmt = db.prepare(
    'SELECT si.*' +
    ' FROM stream_fts sf' +
    ' JOIN stream_index si ON si.rowid = sf.rowid' +
    ' WHERE stream_fts MATCH ?' +
    ' ORDER BY (CASE WHEN si.status = \'live\' THEN 1 ELSE 0 END) DESC, si.viewer_count DESC' +
    ' LIMIT ?'
  );
  return stmt.all(query, maxRows);
}

function searchCreators(query, limit) {
  var maxRows = limit || 20;
  var stmt = db.prepare(
    'SELECT ci.*' +
    ' FROM creator_fts cf' +
    ' JOIN creator_index ci ON ci.rowid = cf.rowid' +
    ' WHERE creator_fts MATCH ?' +
    ' ORDER BY ci.is_live DESC, ci.follower_count DESC' +
    ' LIMIT ?'
  );
  return stmt.all(query, maxRows);
}

function search(query, type, limit) {
  var maxRows = limit || 20;
  if (type === 'streams') {
    return searchStreams(query, maxRows);
  }
  if (type === 'creators') {
    return searchCreators(query, maxRows);
  }
  var streams = searchStreams(query, maxRows);
  var creators = searchCreators(query, maxRows);
  return streams.concat(creators);
}

module.exports = {
  indexStream: indexStream,
  updateStreamStatus: updateStreamStatus,
  indexCreator: indexCreator,
  searchStreams: searchStreams,
  searchCreators: searchCreators,
  search: search
};
