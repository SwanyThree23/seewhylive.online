// server/services/guestService.js
// Built against your REAL pre-existing tables — no new tables required.
//   stream_guests     — active on-stream guests, mediasoup-wired
//   room_participants — broader room roster (viewers + on-stage)
const db = require('../db'); // <-- verify this matches your actual db module

// ---- stream_guests (on-stream, mediasoup-wired) ----

async function joinStreamAsGuest({ streamId, userId, displayName, role, vdoStreamId, mediasoupProducerId }) {
  const result = await db.query(
    `INSERT INTO stream_guests (stream_id, user_id, display_name, role, vdo_stream_id, mediasoup_producer_id, is_host)
     VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *`,
    [streamId, userId, displayName || null, role || 'guest', vdoStreamId || null, mediasoupProducerId || null]
  );
  return result.rows[0];
}

// Toggle speaking/muted/audio-only/spotlighted state for an active guest.
async function updateGuestState(guestId, patch) {
  const fields = [];
  const values = [];
  let i = 1;

  ['is_speaking', 'is_muted', 'is_audio_only', 'is_spotlighted', 'mediasoup_producer_id'].forEach(function (col) {
    const camelKey = col.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
    if (patch[camelKey] !== undefined) {
      fields.push(`${col} = $${i}`);
      values.push(patch[camelKey]);
      i += 1;
    }
  });
  if (fields.length === 0) return null;

  values.push(guestId);
  const result = await db.query(
    `UPDATE stream_guests SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return result.rows[0];
}

async function leaveStreamAsGuest(streamId, userId) {
  const result = await db.query(
    `UPDATE stream_guests SET left_at = CURRENT_TIMESTAMP
     WHERE stream_id = $1 AND user_id = $2 AND left_at IS NULL RETURNING *`,
    [streamId, userId]
  );
  return result.rows[0];
}

async function getStreamGuests(streamId) {
  const result = await db.query(
    `SELECT * FROM stream_guests WHERE stream_id = $1 AND left_at IS NULL ORDER BY joined_at ASC`,
    [streamId]
  );
  return result.rows;
}

// ---- room_participants (broader roster: viewers + on-stage) ----

async function joinRoomAsParticipant({ streamId, userId, role }) {
  const result = await db.query(
    `INSERT INTO room_participants (stream_id, user_id, role) VALUES ($1, $2, $3) RETURNING *`,
    [streamId, userId, role || 'viewer']
  );
  return result.rows[0];
}

async function updateParticipantState(participantId, patch) {
  const fields = [];
  const values = [];
  let i = 1;

  ['is_on_stage', 'is_muted', 'is_camera_off', 'role'].forEach(function (col) {
    const camelKey = col.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
    if (patch[camelKey] !== undefined) {
      fields.push(`${col} = $${i}`);
      values.push(patch[camelKey]);
      i += 1;
    }
  });
  if (fields.length === 0) return null;

  values.push(participantId);
  const result = await db.query(
    `UPDATE room_participants SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return result.rows[0];
}

async function leaveRoom(streamId, userId) {
  const result = await db.query(
    `UPDATE room_participants SET left_at = now()
     WHERE stream_id = $1 AND user_id = $2 AND left_at IS NULL RETURNING *`,
    [streamId, userId]
  );
  return result.rows[0];
}

async function getRoomParticipants(streamId) {
  const result = await db.query(
    `SELECT * FROM room_participants WHERE stream_id = $1 AND left_at IS NULL ORDER BY joined_at ASC`,
    [streamId]
  );
  return result.rows;
}

module.exports = {
  joinStreamAsGuest,
  updateGuestState,
  leaveStreamAsGuest,
  getStreamGuests,
  joinRoomAsParticipant,
  updateParticipantState,
  leaveRoom,
  getRoomParticipants,
};
