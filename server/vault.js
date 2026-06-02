'use strict';

/**
 * vault.js - AES-256-GCM encrypted key storage for SeeWhy LIVE v33.0
 * Stores stream keys encrypted at rest in SQLite.
 * NEVER exposes raw keys to the frontend.
 */

var crypto = require('crypto');
var Database = require('better-sqlite3');

var DB_PATH = process.env.DB_PATH || '/opt/seewhy/data/seewhy.db';
var ALGORITHM = 'aes-256-gcm';

var db = null;

/**
 * Initialize the SQLite database and create stream_keys table if absent.
 */
function initDb() {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS stream_keys (
      guest_id    TEXT    NOT NULL,
      dest_id     TEXT    NOT NULL,
      encrypted_key TEXT  NOT NULL,
      created_at  INTEGER NOT NULL,
      PRIMARY KEY (guest_id, dest_id)
    );
  `);

  return db;
}

/**
 * Get a 32-byte Buffer from the hex VAULT_SECRET env var.
 * Throws hard if the secret is missing or wrong length.
 */
function getVaultKey() {
  var hex = process.env.VAULT_SECRET;
  if (!hex || hex.length !== 64) {
    throw new Error('VAULT_SECRET must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns "iv:authTag:ciphertext" (all hex, colon-separated).
 *
 * @param {string} plaintext
 * @returns {string}
 */
function encrypt(plaintext) {
  var key = getVaultKey();
  var iv = crypto.randomBytes(12); // 96-bit IV for GCM
  var cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  var encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);

  var authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex')
  ].join(':');
}

/**
 * Decrypt a stored "iv:authTag:ciphertext" hex string.
 *
 * @param {string} stored
 * @returns {string}
 */
function decrypt(stored) {
  var parts = stored.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format: expected iv:authTag:ciphertext');
  }

  var iv = Buffer.from(parts[0], 'hex');
  var authTag = Buffer.from(parts[1], 'hex');
  var ciphertext = Buffer.from(parts[2], 'hex');

  var key = getVaultKey();
  var decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  var decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

/**
 * Encrypt and store a stream key.
 *
 * @param {string} guestId
 * @param {string} destId
 * @param {string} plainKey
 */
function saveKey(guestId, destId, plainKey) {
  var database = initDb();
  var encryptedKey = encrypt(plainKey);
  var createdAt = Math.floor(Date.now() / 1000);

  var stmt = database.prepare(`
    INSERT INTO stream_keys (guest_id, dest_id, encrypted_key, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(guest_id, dest_id) DO UPDATE SET
      encrypted_key = excluded.encrypted_key,
      created_at    = excluded.created_at
  `);

  stmt.run(guestId, destId, encryptedKey, createdAt);
}

/**
 * Remove a stored key.
 *
 * @param {string} guestId
 * @param {string} destId
 */
function deleteKey(guestId, destId) {
  var database = initDb();
  database.prepare(
    'DELETE FROM stream_keys WHERE guest_id = ? AND dest_id = ?'
  ).run(guestId, destId);
}

/**
 * Decrypt and return the raw stream key. FOR SERVER-SIDE FFMPEG USE ONLY.
 * Never return this value to a frontend client.
 *
 * @param {string} guestId
 * @param {string} destId
 * @returns {string|null}
 */
function getDecryptedKey(guestId, destId) {
  var database = initDb();
  var row = database.prepare(
    'SELECT encrypted_key FROM stream_keys WHERE guest_id = ? AND dest_id = ?'
  ).get(guestId, destId);

  if (!row) return null;
  return decrypt(row.encrypted_key);
}

/**
 * Return true if a key exists for the given guest/destination pair.
 * Safe to check from frontend-initiated code because no key data is returned.
 *
 * @param {string} guestId
 * @param {string} destId
 * @returns {boolean}
 */
function hasKey(guestId, destId) {
  var database = initDb();
  var row = database.prepare(
    'SELECT 1 FROM stream_keys WHERE guest_id = ? AND dest_id = ? LIMIT 1'
  ).get(guestId, destId);

  return row !== undefined;
}

/**
 * Return metadata (no keys) for all destinations a guest has saved.
 *
 * @param {string} guestId
 * @returns {Array<{destId: string, createdAt: number}>}
 */
function listGuestKeyMeta(guestId) {
  var database = initDb();
  var rows = database.prepare(
    'SELECT dest_id, created_at FROM stream_keys WHERE guest_id = ? ORDER BY created_at DESC'
  ).all(guestId);

  return rows.map(function(row) {
    return { destId: row.dest_id, createdAt: row.created_at };
  });
}

module.exports = {
  encrypt,
  decrypt,
  saveKey,
  deleteKey,
  getDecryptedKey,
  hasKey,
  listGuestKeyMeta,
  initDb
};
