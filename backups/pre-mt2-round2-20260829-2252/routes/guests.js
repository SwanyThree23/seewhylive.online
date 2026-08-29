const express = require('express');
const router = express.Router();
const guestService = require('../services/guestService');
const requireAuth  = require('../middleware/auth');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.post('/streams/:streamId/join', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const { displayName, vdoStreamId, mediasoupProducerId } = req.body;
    const guest = await guestService.joinStreamAsGuest({
      tenantId: req.tenantId,
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
  const isHostOp = req.body.isSpotlighted !== undefined;
  if (isHostOp && req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'only hosts may set spotlight' });
  }
  try {
    const guest = isHostOp
      ? await guestService.updateGuestState(req.tenantId, req.params.guestId, req.body, null, req.user.id)
      : await guestService.updateGuestState(req.tenantId, req.params.guestId, req.body, req.user.id);
    if (!guest) return res.status(403).json({ error: 'not found or forbidden' });
    res.json(guest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/streams/:streamId/leave', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const result = await guestService.leaveStreamAsGuest(req.tenantId, req.params.streamId, req.user.id);
    if (!result) return res.status(404).json({ error: 'not an active guest in this stream' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/streams/:streamId', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const guests = await guestService.getStreamGuests(req.tenantId, req.params.streamId);
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/streams/:streamId/participants', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const participant = await guestService.joinRoomAsParticipant({
      tenantId: req.tenantId,
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
  const isHostOp = req.body.isOnStage !== undefined;
  if (isHostOp && req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'only hosts may move participants on stage' });
  }
  try {
    const participant = isHostOp
      ? await guestService.updateParticipantState(req.tenantId, req.params.participantId, req.body, null, req.user.id)
      : await guestService.updateParticipantState(req.tenantId, req.params.participantId, req.body, req.user.id);
    if (!participant) return res.status(403).json({ error: 'not found or forbidden' });
    res.json(participant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/streams/:streamId/participants/leave', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const result = await guestService.leaveRoom(req.tenantId, req.params.streamId, req.user.id);
    if (!result) return res.status(404).json({ error: 'not an active participant in this stream' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/streams/:streamId/participants', requireAuth, async (req, res) => {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    const participants = await guestService.getRoomParticipants(req.tenantId, req.params.streamId);
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
