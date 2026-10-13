// server/services/inviteService.js
// Built against your REAL pre-existing tables — no new tables required.
//   guest_invitations    — direct user-to-user invite (from_user_id -> to_user_id)
//   stream_guest_invites — shareable token invite LINKS (VDO.Ninja-style)
const crypto = require('crypto');
const db = require('../db'); // <-- verify this matches your actual db module

const DEFAULT_EXPIRY_HOURS = 1;

// ---- guest_invitations (direct, user-to-user) ----

async function sendInvitation({ tenantId, fromUserId, toUserId, roomId, message, expiryHours }) {
  if (fromUserId === toUserId) { const e = new Error('cannot invite yourself'); e.status = 400; throw e; }
  if (message && (typeof message !== 'string' || message.length > 500)) {
    const e = new Error('message must be at most 500 characters'); e.status = 400; throw e;
  }
  const MAX_EXPIRY_HOURS = 168; // 7 days
  const _rawHours = Math.floor(Number(expiryHours) || DEFAULT_EXPIRY_HOURS);
  const hours = Math.min(Math.max(1, _rawHours), MAX_EXPIRY_HOURS);
  const target = await db.query('SELECT id FROM users WHERE id = $1 AND tenant_id = $2', [toUserId, tenantId]);
  if (!target.rows[0]) { const e = new Error('user not found'); e.status = 404; throw e; }
  const result = await db.query(
    `INSERT INTO guest_invitations (from_user_id, to_user_id, room_id, message, status, expires_at, tenant_id)
     VALUES ($1, $2, $3, $4, 'pending', now() + ($5 * interval '1 hour'), $6) RETURNING *`,
    [fromUserId, toUserId, roomId, message || null, hours, tenantId]
  );
  return result.rows[0];
}

async function respondToInvitation(inviteId, status, userId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  if (status !== 'accepted' && status !== 'declined') {
    throw new Error('status must be "accepted" or "declined"');
  }
  const result = await db.query(
    `UPDATE guest_invitations SET status = $2
     WHERE id = $1 AND to_user_id = $3 AND tenant_id = $4
       AND status = 'pending' AND expires_at > now() RETURNING *`,
    [inviteId, status, userId, tenantId]
  );
  return result.rows[0];
}

async function getPendingInvitations(userId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const result = await db.query(
    `SELECT * FROM guest_invitations
     WHERE to_user_id = $1 AND tenant_id = $2 AND status = 'pending' AND expires_at > now()
     ORDER BY created_at DESC`,
    [userId, tenantId]
  );
  return result.rows;
}

// ---- stream_guest_invites (shareable link, token-based) ----

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

async function createInviteLink({ streamId, tenantId, createdBy, displayName, role, maxUses }) {
  if (!tenantId) throw new Error('tenantId is required');
  const token = generateToken();
  const result = await db.query(
    `INSERT INTO stream_guest_invites (stream_id, tenant_id, guest_token, display_name, role, created_by, max_uses)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [streamId, tenantId, token, displayName || null, role || 'guest', createdBy, maxUses || 1]
  );
  return result.rows[0];
}

// Validates and consumes one use of an invite link. Does not itself create a
// stream_guests row — call guestService.joinStreamAsGuest() after this succeeds.
async function redeemInviteLink(token, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const result = await db.query(
    `UPDATE stream_guest_invites
     SET use_count = use_count + 1, used_at = now()
     WHERE guest_token = $1 AND tenant_id = $2 AND use_count < max_uses AND revoked_at IS NULL
       AND (expires_at IS NULL OR expires_at > now())
     RETURNING *`,
    [token, tenantId]
  );
  if (!result.rows[0]) throw new Error('invite link not found, exhausted, or revoked');
  return result.rows[0];
}

async function revokeInviteLink(inviteId, createdBy, tenantId) {
  const result = await db.query(
    `UPDATE stream_guest_invites SET revoked_at = now()
     WHERE id = $1 AND created_by = $2 AND tenant_id = $3 AND revoked_at IS NULL RETURNING *`,
    [inviteId, createdBy, tenantId]
  );
  return result.rows[0];
}

async function getStreamInviteLinks(streamId, tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const result = await db.query(
    `SELECT * FROM stream_guest_invites WHERE stream_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
    [streamId, tenantId]
  );
  return result.rows;
}

module.exports = {
  sendInvitation,
  respondToInvitation,
  getPendingInvitations,
  createInviteLink,
  redeemInviteLink,
  revokeInviteLink,
  getStreamInviteLinks,
};
