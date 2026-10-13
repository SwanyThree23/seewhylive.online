// server/services/guestService.js
// Built against your REAL pre-existing tables — no new tables required.
//   stream_guests     — active on-stream guests, mediasoup-wired
//   room_participants — broader room roster (viewers + on-stage)
const db = require('../db'); // <-- verify this matches your actual db module

// ---- stream_guests (on-stream, mediasoup-wired) ----

var ALLOWED_GUEST_ROLES = ['guest', 'viewer', 'co-host'];

async function joinStreamAsGuest({ streamId, tenantId, userId, displayName, role, vdoStreamId, mediasoupProducerId }) {
  if (!tenantId) { const e = new Error('tenantId is required'); e.status = 400; throw e; }
  if (role && !ALLOWED_GUEST_ROLES.includes(role)) { const e = new Error('invalid role'); e.status = 400; throw e; }
  const tenantCheck = await db.query('SELECT id FROM streams WHERE id = $1 AND tenant_id = $2', [streamId, tenantId]);
  if (!tenantCheck.rows[0]) { const e = new Error('stream not found'); e.status = 404; throw e; }
  const result = await db.query(
    `INSERT INTO stream_guests (stream_id, user_id, display_name, role, vdo_stream_id, mediasoup_producer_id, is_host)
     VALUES ($1, $2, $3, $4, $5, $6, false)
     ON CONFLICT (stream_id, user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           role = EXCLUDED.role,
           joined_at = now()
     RETURNING *`,
    [streamId, userId, displayName || null, role || 'guest', vdoStreamId || null, mediasoupProducerId || null]
  );
  return result.rows[0];
}

// Toggle speaking/muted/audio-only/spotlighted state for an active guest.
// Self-update (guest): pass userId, omit streamOwnerId.
// Host-controlled update (e.g. spotlight): pass streamOwnerId instead; the query
// scopes to guests in streams owned by that user, preventing cross-stream IDOR.
async function updateGuestState(guestId, patch, userId, streamOwnerId) {
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

  let result;
  if (streamOwnerId) {
    values.push(guestId, streamOwnerId);
    result = await db.query(
      `UPDATE stream_guests SET ${fields.join(', ')}
       FROM streams
       WHERE stream_guests.id = $${i} AND stream_guests.stream_id = streams.id AND streams.creator_id = $${i + 1}
       RETURNING stream_guests.*`,
      values
    );
  } else {
    values.push(guestId, userId);
    result = await db.query(
      `UPDATE stream_guests SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      values
    );
  }
  return result.rows[0] || null;
}

async function leaveStreamAsGuest(streamId, userId) {
  const result = await db.query(
    `UPDATE stream_guests SET left_at = CURRENT_TIMESTAMP
     WHERE stream_id = $1 AND user_id = $2 AND left_at IS NULL RETURNING *`,
    [streamId, userId]
  );
  return result.rows[0];
}

async function getStreamGuests(streamId, tenantId) {
  const result = await db.query(
    `SELECT sg.* FROM stream_guests sg
     JOIN streams s ON s.id = sg.stream_id
     WHERE sg.stream_id = $1 AND sg.left_at IS NULL
       AND s.tenant_id = $2
     ORDER BY sg.joined_at ASC`,
    [streamId, tenantId]
  );
  return result.rows;
}

// ---- room_participants (broader roster: viewers + on-stage) ----

async function joinRoomAsParticipant({ streamId, userId, role, tenantId }) {
  if (role && !ALLOWED_GUEST_ROLES.includes(role)) { const e = new Error('invalid role'); e.status = 400; throw e; }
  if (tenantId) {
    const streamCheck = await db.query(
      'SELECT id FROM streams WHERE id = $1 AND tenant_id = $2',
      [streamId, tenantId]
    );
    if (!streamCheck.rows[0]) { const e = new Error('stream not found'); e.status = 404; throw e; }
  }
  const result = await db.query(
    `INSERT INTO room_participants (stream_id, user_id, role) VALUES ($1, $2, $3)
     ON CONFLICT (stream_id, user_id) DO UPDATE
       SET role = EXCLUDED.role,
           joined_at = now()
     RETURNING *`,
    [streamId, userId, role || 'viewer']
  );
  return result.rows[0];
}

// Self-update: pass userId, omit streamOwnerId.
// Host-controlled (e.g. isOnStage): pass streamOwnerId; scopes to participants
// in streams owned by that user to prevent cross-stream IDOR.
async function updateParticipantState(participantId, patch, userId, streamOwnerId) {
  const fields = [];
  const values = [];
  let i = 1;

  // 'role' excluded — callers cannot self-escalate their own role
  ['is_on_stage', 'is_muted', 'is_camera_off'].forEach(function (col) {
    const camelKey = col.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); });
    if (patch[camelKey] !== undefined) {
      fields.push(`${col} = $${i}`);
      values.push(patch[camelKey]);
      i += 1;
    }
  });
  if (fields.length === 0) return null;

  let result;
  if (streamOwnerId) {
    values.push(participantId, streamOwnerId);
    result = await db.query(
      `UPDATE room_participants SET ${fields.join(', ')}
       FROM streams
       WHERE room_participants.id = $${i} AND room_participants.stream_id = streams.id AND streams.creator_id = $${i + 1}
       RETURNING room_participants.*`,
      values
    );
  } else {
    values.push(participantId, userId);
    result = await db.query(
      `UPDATE room_participants SET ${fields.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      values
    );
  }
  return result.rows[0] || null;
}

async function leaveRoom(streamId, userId) {
  const result = await db.query(
    `UPDATE room_participants SET left_at = now()
     WHERE stream_id = $1 AND user_id = $2 AND left_at IS NULL RETURNING *`,
    [streamId, userId]
  );
  return result.rows[0];
}

async function getRoomParticipants(streamId, tenantId) {
  const result = await db.query(
    `SELECT rp.* FROM room_participants rp
     JOIN streams s ON s.id = rp.stream_id
     WHERE rp.stream_id = $1 AND rp.left_at IS NULL
       AND s.tenant_id = $2
     ORDER BY rp.joined_at ASC`,
    [streamId, tenantId]
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
