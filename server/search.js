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

// Keep stream_fts in sync with stream_index via triggers (replaces full rebuild on every write)
db.exec(
  'CREATE TRIGGER IF NOT EXISTS stream_index_ai AFTER INSERT ON stream_index BEGIN\n' +
  '  INSERT INTO stream_fts(rowid,title,description,host_username,host_display_name,genre)\n' +
  '  VALUES(new.rowid,new.title,new.description,new.host_username,new.host_display_name,new.genre);\n' +
  'END;'
);
db.exec(
  'CREATE TRIGGER IF NOT EXISTS stream_index_ad AFTER DELETE ON stream_index BEGIN\n' +
  '  INSERT INTO stream_fts(stream_fts,rowid,title,description,host_username,host_display_name,genre)\n' +
  '  VALUES(\'delete\',old.rowid,old.title,old.description,old.host_username,old.host_display_name,old.genre);\n' +
  'END;'
);
db.exec(
  'CREATE TRIGGER IF NOT EXISTS stream_index_au AFTER UPDATE ON stream_index BEGIN\n' +
  '  INSERT INTO stream_fts(stream_fts,rowid,title,description,host_username,host_display_name,genre)\n' +
  '  VALUES(\'delete\',old.rowid,old.title,old.description,old.host_username,old.host_display_name,old.genre);\n' +
  '  INSERT INTO stream_fts(rowid,title,description,host_username,host_display_name,genre)\n' +
  '  VALUES(new.rowid,new.title,new.description,new.host_username,new.host_display_name,new.genre);\n' +
  'END;'
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

// Keep creator_fts in sync with creator_index via triggers
db.exec(
  'CREATE TRIGGER IF NOT EXISTS creator_index_ai AFTER INSERT ON creator_index BEGIN\n' +
  '  INSERT INTO creator_fts(rowid,username,display_name,bio)\n' +
  '  VALUES(new.rowid,new.username,new.display_name,new.bio);\n' +
  'END;'
);
db.exec(
  'CREATE TRIGGER IF NOT EXISTS creator_index_ad AFTER DELETE ON creator_index BEGIN\n' +
  '  INSERT INTO creator_fts(creator_fts,rowid,username,display_name,bio)\n' +
  '  VALUES(\'delete\',old.rowid,old.username,old.display_name,old.bio);\n' +
  'END;'
);
db.exec(
  'CREATE TRIGGER IF NOT EXISTS creator_index_au AFTER UPDATE ON creator_index BEGIN\n' +
  '  INSERT INTO creator_fts(creator_fts,rowid,username,display_name,bio)\n' +
  '  VALUES(\'delete\',old.rowid,old.username,old.display_name,old.bio);\n' +
  '  INSERT INTO creator_fts(rowid,username,display_name,bio)\n' +
  '  VALUES(new.rowid,new.username,new.display_name,new.bio);\n' +
  'END;'
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
  // FTS index is kept in sync by stream_index_ai/au triggers; no manual rebuild needed
}

function updateStreamStatus(streamId, status, viewerCount) {
  stmtUpdateStreamStatus.run(status, viewerCount || 0, streamId);
}

function indexCreator(userId, username, displayName, bio, isLive, followerCount) {
  stmtUpsertCreator.run(userId, username, displayName, bio, isLive ? 1 : 0, followerCount || 0);
  // FTS index is kept in sync by creator_index_ai/au triggers; no manual rebuild needed
}

// Sanitize FTS5 query: wrap in double quotes so the input is treated as a
// phrase literal rather than an FTS5 expression. Internal double-quotes are
// escaped as "" per SQLite FTS5 spec (prevents parse errors and injection).
function _sanitizeFtsQuery(raw) {
  var s = String(raw || '').slice(0, 200).trim();
  return '"' + s.replace(/"/g, '""') + '"';
}

function searchStreams(query, limit) {
  var maxRows = Math.min(Math.floor(limit || 20), 100);
  var safeQuery = _sanitizeFtsQuery(query);
  var stmt = db.prepare(
    'SELECT si.*' +
    ' FROM stream_fts sf' +
    ' JOIN stream_index si ON si.rowid = sf.rowid' +
    ' WHERE stream_fts MATCH ?' +
    ' ORDER BY (CASE WHEN si.status = \'live\' THEN 1 ELSE 0 END) DESC, si.viewer_count DESC' +
    ' LIMIT ?'
  );
  return stmt.all(safeQuery, maxRows);
}

function searchCreators(query, limit) {
  var maxRows = Math.min(Math.floor(limit || 20), 100);
  var safeQuery = _sanitizeFtsQuery(query);
  var stmt = db.prepare(
    'SELECT ci.*' +
    ' FROM creator_fts cf' +
    ' JOIN creator_index ci ON ci.rowid = cf.rowid' +
    ' WHERE creator_fts MATCH ?' +
    ' ORDER BY ci.is_live DESC, ci.follower_count DESC' +
    ' LIMIT ?'
  );
  return stmt.all(safeQuery, maxRows);
}

function search(query, type, limit) {
  var maxRows = Math.min(Math.floor(limit || 20), 100);
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
