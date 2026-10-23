// server/services/panelService.js
'use strict';
const db = require('../db');
const crypto = require('crypto');

async function assignSlot({ roomId, userId, tenantId }) {
  if (!tenantId) { const e = new Error('tenantId is required'); e.status = 400; throw e; }
  const room = await db.query(
    'SELECT max_panel_guests FROM streams WHERE id = $1 AND tenant_id = $2',
    [roomId, tenantId]
  );
  if (!room.rows.length) {
    const err = new Error('Room not found');
    err.status = 404;
    throw err;
  }
  const maxGuests = room.rows[0].max_panel_guests;

  const existing = await db.query(
    'SELECT * FROM room_panel_slots WHERE stream_id = $1 AND user_id = $2',
    [roomId, userId]
  );
  if (existing.rows.length) return { slot: existing.rows[0], isNew: false };

  // Atomically find the lowest free slot and claim it in one round-trip.
  // This eliminates the TOCTOU between reading taken slots and inserting —
  // the NOT EXISTS subquery and the INSERT run at the same snapshot.
  const result = await db.query(
    `INSERT INTO room_panel_slots (stream_id, slot_index, user_id)
     SELECT $1, s.i, $3
     FROM generate_series(0, $2::int - 1) AS s(i)
     WHERE NOT EXISTS (
       SELECT 1 FROM room_panel_slots
       WHERE stream_id = $1 AND slot_index = s.i
     )
     ORDER BY s.i
     LIMIT 1
     RETURNING *`,
    [roomId, maxGuests, userId]
  );
  if (!result.rows.length) {
    const err = new Error('Panel is full');
    err.status = 409;
    throw err;
  }
  return { slot: result.rows[0], isNew: true };
}

async function releaseSlot({ roomId, userId }) {
  var result = await db.query('DELETE FROM room_panel_slots WHERE stream_id = $1 AND user_id = $2', [roomId, userId]);
  return result.rowCount || 0;
}

async function checkJoinGate({ roomId, userId, inviteCode = null, tenantId = null }) {
  if (!tenantId) { const e = new Error('tenantId is required'); e.status = 400; throw e; }
  const room = await db.query(
    'SELECT privacy, invite_code, private_gating_mode, creator_id FROM streams WHERE id = $1 AND tenant_id = $2',
    [roomId, tenantId]
  );
  if (!room.rows.length) {
    const err = new Error('Room not found');
    err.status = 404;
    throw err;
  }
  const r = room.rows[0];
  if (r.privacy !== 'private' || userId === r.creator_id) return { allowed: true };

  if (r.private_gating_mode === 'invite_code') {
    if (inviteCode && r.invite_code) {
      const cappedCode = String(inviteCode).slice(0, 512);
      const h1 = crypto.createHash('sha256').update(cappedCode).digest();
      const h2 = crypto.createHash('sha256').update(String(r.invite_code)).digest();
      if (crypto.timingSafeEqual(h1, h2)) return { allowed: true };
    }
    return { allowed: false, reason: 'invalid_code' };
  }

  if (r.private_gating_mode === 'approval') {
    const existing = await db.query(
      'SELECT status FROM room_join_requests WHERE stream_id = $1 AND user_id = $2',
      [roomId, userId]
    );
    if (existing.rows.length && existing.rows[0].status === 'approved') return { allowed: true };
    return { allowed: false, reason: 'needs_approval' };
  }

  return { allowed: false, reason: 'unknown_gating_mode' };
}

async function requestJoin({ roomId, userId }) {
  const result = await db.query(
    `INSERT INTO room_join_requests (stream_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (stream_id, user_id) DO UPDATE SET status = 'pending', requested_at = now(), resolved_at = NULL
     RETURNING *`,
    [roomId, userId]
  );
  const row = result.rows[0];
  // Enrich with display info for the host's approval queue
  const userRow = await db.query('SELECT display_name, avatar_url FROM users WHERE id = $1', [userId]);
  if (userRow.rows[0]) {
    row.display_name = userRow.rows[0].display_name;
    row.avatar_url   = userRow.rows[0].avatar_url;
  }
  return row;
}

async function resolveJoinRequest({ roomId, userId, approve }) {
  // Access control is enforced by the socket handler (host or cohost for the
  // correct room) before this service is called. A creator-only check here
  // would silently block cohosts even though they have legitimate authority
  // to resolve join requests.
  const result = await db.query(
    `UPDATE room_join_requests SET status = $3, resolved_at = now()
     WHERE stream_id = $1 AND user_id = $2 RETURNING *`,
    [roomId, userId, approve === true ? 'approved' : 'denied']
  );
  return result.rows[0];
}

function generateInviteCode() {
  return crypto.randomBytes(12).toString('hex').toUpperCase();
}

async function setExpandedSlot({ roomId, tenantId, slotIndex, expanded }) {
  const room = await db.query(
    'SELECT id FROM streams WHERE id = $1 AND tenant_id = $2',
    [roomId, tenantId]
  );
  if (!room.rows.length) {
    const err = new Error('room not found or forbidden');
    err.status = 403;
    throw err;
  }
  if (expanded) {
    await db.query('UPDATE room_panel_slots SET is_expanded = false WHERE stream_id = $1', [roomId]);
  }
  const result = await db.query(
    `UPDATE room_panel_slots SET is_expanded = $3 WHERE stream_id = $1 AND slot_index = $2 RETURNING *`,
    [roomId, slotIndex, expanded]
  );
  return result.rows[0];
}

async function setAudioOnly({ roomId, tenantId, isAudioOnly }) {
  const result = await db.query(
    'UPDATE streams SET is_audio_only = $2 WHERE id = $1 AND tenant_id = $3 RETURNING *',
    [roomId, isAudioOnly, tenantId]
  );
  return result.rows[0];
}

async function setPrivacy({ tenantId, roomId, isPrivate, gatingMode = null }) {
  let inviteCode = null;
  if (isPrivate && gatingMode === 'invite_code') {
    inviteCode = generateInviteCode();
  }
  const result = await db.query(
    `UPDATE streams SET privacy = $2, private_gating_mode = $3, invite_code = $4
     WHERE id = $1 AND tenant_id = $5
     RETURNING id, privacy, private_gating_mode, invite_code`,
    [roomId, isPrivate ? 'private' : 'public', isPrivate ? gatingMode : null, inviteCode, tenantId]
  );
  return result.rows[0];
}

async function setMuted({ roomId, userId, isMuted }) {
  await db.query(
    'UPDATE room_panel_slots SET is_muted = $3 WHERE stream_id = $1 AND user_id = $2',
    [roomId, userId, isMuted]
  );
}

async function swapSlots({ roomId, userA, userB }) {
  // Atomically swap slot_index values between two occupants using a CTE
  await db.query(
    `WITH indices AS (
       SELECT user_id, slot_index FROM room_panel_slots
       WHERE stream_id = $1 AND user_id = ANY(ARRAY[$2,$3]::text[])
     )
     UPDATE room_panel_slots rps
     SET slot_index = (
       CASE rps.user_id
         WHEN $2 THEN (SELECT slot_index FROM indices WHERE user_id = $3)
         WHEN $3 THEN (SELECT slot_index FROM indices WHERE user_id = $2)
       END
     )
     WHERE rps.stream_id = $1 AND rps.user_id = ANY(ARRAY[$2,$3]::text[])`,
    [roomId, userA, userB]
  );
  return getPanelState(roomId);
}

async function getPanelState(roomId) {
  const slots = await db.query(
    `SELECT s.*, u.display_name, u.avatar_url
     FROM room_panel_slots s JOIN users u ON u.id = s.user_id
     WHERE s.stream_id = $1 ORDER BY s.slot_index`,
    [roomId]
  );
  return slots.rows;
}

module.exports = {
  assignSlot, releaseSlot, checkJoinGate, requestJoin, resolveJoinRequest,
  generateInviteCode, setExpandedSlot, setAudioOnly, setPrivacy, getPanelState, setMuted,
  swapSlots,
};
