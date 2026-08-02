// server/routes/guests.js
// INTEGRATION: mount in your main router, e.g.:
//   app.use('/api/guests', require('./routes/guests'));

const express = require('express');
const router = express.Router();
const guestService = require('../services/guestService');
const requireAuth  = require('../middleware/auth');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- on-stream guests (stream_guests) ---

router.post('/streams/:streamId/join', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const { displayName, vdoStreamId, mediasoupProducerId } = req.body;
    const guest = await guestService.joinStreamAsGuest({
      streamId: req.params.streamId,
      userId: req.user.id,
      displayName: displayName ? String(displayName).slice(0, 80) : null,
      role: 'guest',
      vdoStreamId: vdoStreamId ? String(vdoStreamId).slice(0, 200) : null,
      mediasoupProducerId: mediasoupProducerId ? String(mediasoupProducerId).slice(0, 200) : null,
    });
    res.status(201).json(guest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/guests/:guestId', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.guestId)) return res.status(400).json({ error: 'invalid guest id' });
  // is_spotlighted is host-controlled — guests cannot spotlight themselves
  const isHostOp = req.body.isSpotlighted !== undefined;
  if (isHostOp && req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'only hosts may set spotlight' });
  }
  try {
    // Host operations scope by stream ownership to prevent cross-stream IDOR;
    // self-updates scope by user_id (guest owns their own record).
    const guest = isHostOp
      ? await guestService.updateGuestState(req.params.guestId, req.body, null, req.user.id)
      : await guestService.updateGuestState(req.params.guestId, req.body, req.user.id);
    if (!guest) return res.status(403).json({ error: 'not found or forbidden' });
    res.json(guest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/streams/:streamId/leave', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const result = await guestService.leaveStreamAsGuest(req.params.streamId, req.user.id);
    if (!result) return res.status(404).json({ error: 'not an active guest in this stream' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/streams/:streamId', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const guests = await guestService.getStreamGuests(req.params.streamId);
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- broader room roster (room_participants) ---

router.post('/streams/:streamId/participants', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const participant = await guestService.joinRoomAsParticipant({
      streamId: req.params.streamId,
      userId: req.user.id,
      role: 'viewer',
    });
    res.status(201).json(participant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/participants/:participantId', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.participantId)) return res.status(400).json({ error: 'invalid participant id' });
  // is_on_stage is host-controlled — viewers cannot promote themselves onto stage
  const isHostOp = req.body.isOnStage !== undefined;
  if (isHostOp && req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'only hosts may move participants on stage' });
  }
  try {
    // Host operations scope by stream ownership; self-updates scope by user_id.
    const participant = isHostOp
      ? await guestService.updateParticipantState(req.params.participantId, req.body, null, req.user.id)
      : await guestService.updateParticipantState(req.params.participantId, req.body, req.user.id);
    if (!participant) return res.status(403).json({ error: 'not found or forbidden' });
    res.json(participant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/streams/:streamId/participants/leave', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const result = await guestService.leaveRoom(req.params.streamId, req.user.id);
    if (!result) return res.status(404).json({ error: 'not an active participant in this stream' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/streams/:streamId/participants', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const participants = await guestService.getRoomParticipants(req.params.streamId);
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
