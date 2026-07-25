// server/services/inviteService.js
// Built against your REAL pre-existing tables — no new tables required.
//   guest_invitations    — direct user-to-user invite (from_user_id -> to_user_id)
//   stream_guest_invites — shareable token invite LINKS (VDO.Ninja-style)
const crypto = require('crypto');
const db = require('../db'); // <-- verify this matches your actual db module

const DEFAULT_EXPIRY_HOURS = 1;

// ---- guest_invitations (direct, user-to-user) ----

async function sendInvitation({ fromUserId, toUserId, roomId, message, expiryHours }) {
  const hours = expiryHours || DEFAULT_EXPIRY_HOURS;
  const result = await db.query(
    `INSERT INTO guest_invitations (from_user_id, to_user_id, room_id, message, status, expires_at)
     VALUES ($1, $2, $3, $4, 'pending', now() + ($5 || ' hours')::interval) RETURNING *`,
    [fromUserId, toUserId, roomId, message || null, hours]
  );
  return result.rows[0];
}

async function respondToInvitation(inviteId, status, userId) {
  if (status !== 'accepted' && status !== 'declined') {
    throw new Error('status must be "accepted" or "declined"');
  }
  const result = await db.query(
    `UPDATE guest_invitations SET status = $2
     WHERE id = $1 AND to_user_id = $3 AND status = 'pending' AND expires_at > now() RETURNING *`,
    [inviteId, status, userId]
  );
  return result.rows[0];
}

async function getPendingInvitations(userId) {
  const result = await db.query(
    `SELECT * FROM guest_invitations
     WHERE to_user_id = $1 AND status = 'pending' AND expires_at > now()
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

// ---- stream_guest_invites (shareable link, token-based) ----

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

async function createInviteLink({ streamId, createdBy, displayName, role, maxUses }) {
  const token = generateToken();
  const result = await db.query(
    `INSERT INTO stream_guest_invites (stream_id, guest_token, display_name, role, created_by, max_uses)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [streamId, token, displayName || null, role || 'guest', createdBy, maxUses || 1]
  );
  return result.rows[0];
}

// Validates and consumes one use of an invite link. Does not itself create a
// stream_guests row — call guestService.joinStreamAsGuest() after this succeeds.
async function redeemInviteLink(token) {
  const invite = await db.query(
    `SELECT * FROM stream_guest_invites WHERE guest_token = $1`,
    [token]
  );
  const row = invite.rows[0];
  if (!row) throw new Error('invite link not found');
  if (row.revoked_at) throw new Error('invite link has been revoked');
  if (row.use_count >= row.max_uses) throw new Error('invite link has reached its use limit');

  const result = await db.query(
    `UPDATE stream_guest_invites
     SET use_count = use_count + 1, used_at = now()
     WHERE id = $1 RETURNING *`,
    [row.id]
  );
  return result.rows[0];
}

async function revokeInviteLink(inviteId, createdBy) {
  const result = await db.query(
    `UPDATE stream_guest_invites SET revoked_at = now()
     WHERE id = $1 AND created_by = $2 AND revoked_at IS NULL RETURNING *`,
    [inviteId, createdBy]
  );
  return result.rows[0];
}

async function getStreamInviteLinks(streamId, createdBy) {
  const result = await db.query(
    `SELECT * FROM stream_guest_invites WHERE stream_id = $1 AND created_by = $2 ORDER BY created_at DESC`,
    [streamId, createdBy]
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
