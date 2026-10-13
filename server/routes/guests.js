'use strict';
var express = require('express');
var router = express.Router();
var guestService = require('../services/guestService');
var requireAuth  = require('../middleware/auth');

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.post('/streams/:streamId/join', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    var displayName = req.body.displayName;
    var vdoStreamId = req.body.vdoStreamId;
    var mediasoupProducerId = req.body.mediasoupProducerId;
    var guest = await guestService.joinStreamAsGuest({
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

router.patch('/guests/:guestId', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.guestId)) return res.status(400).json({ error: 'invalid guest id' });
  var isHostOp = req.body.isSpotlighted !== undefined;
  if (isHostOp && req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'only hosts may set spotlight' });
  }
  try {
    var guest = isHostOp
      ? await guestService.updateGuestState(req.params.guestId, req.body, null, req.user.id)
      : await guestService.updateGuestState(req.params.guestId, req.body, req.user.id);
    if (!guest) return res.status(403).json({ error: 'not found or forbidden' });
    res.json(guest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/streams/:streamId/leave', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    var result = await guestService.leaveStreamAsGuest(req.params.streamId, req.user.id);
    if (!result) return res.status(404).json({ error: 'not an active guest in this stream' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/streams/:streamId', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    var guests = await guestService.getStreamGuests(req.params.streamId, req.tenantId);
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/streams/:streamId/participants', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    var participant = await guestService.joinRoomAsParticipant({
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

router.patch('/participants/:participantId', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.participantId)) return res.status(400).json({ error: 'invalid participant id' });
  var isHostOp = req.body.isOnStage !== undefined;
  if (isHostOp && req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'only hosts may move participants on stage' });
  }
  try {
    var participant = isHostOp
      ? await guestService.updateParticipantState(req.params.participantId, req.body, null, req.user.id)
      : await guestService.updateParticipantState(req.params.participantId, req.body, req.user.id);
    if (!participant) return res.status(403).json({ error: 'not found or forbidden' });
    res.json(participant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/streams/:streamId/participants/leave', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    var result = await guestService.leaveRoom(req.params.streamId, req.user.id);
    if (!result) return res.status(404).json({ error: 'not an active participant in this stream' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/streams/:streamId/participants', requireAuth, async function(req, res) {
  if (!UUID_RE.test(req.params.streamId)) return res.status(400).json({ error: 'invalid stream id' });
  try {
    var participants = await guestService.getRoomParticipants(req.params.streamId, req.tenantId);
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
