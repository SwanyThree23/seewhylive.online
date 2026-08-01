// server/services/panelService.js
const db = require('../db');
const crypto = require('crypto');

async function assignSlot({ roomId, userId }) {
  const room = await db.query('SELECT max_panel_guests FROM streams WHERE id = $1', [roomId]);
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

  const taken = await db.query(
    'SELECT slot_index FROM room_panel_slots WHERE stream_id = $1 ORDER BY slot_index',
    [roomId]
  );
  const takenIndexes = new Set(taken.rows.map((r) => r.slot_index));

  let nextIndex = null;
  for (let i = 0; i < maxGuests; i++) {
    if (!takenIndexes.has(i)) { nextIndex = i; break; }
  }
  if (nextIndex === null) {
    const err = new Error('Panel is full');
    err.status = 409;
    throw err;
  }

  const result = await db.query(
    `INSERT INTO room_panel_slots (stream_id, slot_index, user_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [roomId, nextIndex, userId]
  );
  return { slot: result.rows[0], isNew: true };
}

async function releaseSlot({ roomId, userId }) {
  await db.query('DELETE FROM room_panel_slots WHERE stream_id = $1 AND user_id = $2', [roomId, userId]);
}

async function checkJoinGate({ roomId, userId, inviteCode = null }) {
  const room = await db.query(
    'SELECT privacy, invite_code, private_gating_mode, creator_id FROM streams WHERE id = $1',
    [roomId]
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

async function setExpandedSlot({ roomId, slotIndex, expanded }) {
  if (expanded) {
    await db.query('UPDATE room_panel_slots SET is_expanded = false WHERE stream_id = $1', [roomId]);
  }
  const result = await db.query(
    `UPDATE room_panel_slots SET is_expanded = $3 WHERE stream_id = $1 AND slot_index = $2 RETURNING *`,
    [roomId, slotIndex, expanded]
  );
  return result.rows[0];
}

async function setAudioOnly({ roomId, isAudioOnly }) {
  const result = await db.query(
    'UPDATE streams SET is_audio_only = $2 WHERE id = $1 RETURNING *',
    [roomId, isAudioOnly]
  );
  return result.rows[0];
}

async function setPrivacy({ roomId, isPrivate, gatingMode = null }) {
  let inviteCode = null;
  if (isPrivate && gatingMode === 'invite_code') {
    inviteCode = generateInviteCode();
  }
  const result = await db.query(
    `UPDATE streams SET privacy = $2, private_gating_mode = $3, invite_code = $4
     WHERE id = $1 RETURNING id, privacy, private_gating_mode, invite_code`,
    [roomId, isPrivate ? 'private' : 'public', isPrivate ? gatingMode : null, inviteCode]
  );
  return result.rows[0];
}

async function setMuted({ roomId, userId, isMuted }) {
  await db.query(
    'UPDATE room_panel_slots SET is_muted = $3 WHERE stream_id = $1 AND user_id = $2',
    [roomId, userId, isMuted]
  );
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
};
