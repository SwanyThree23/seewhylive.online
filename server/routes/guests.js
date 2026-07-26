// server/routes/guests.js
// INTEGRATION: mount in your main router, e.g.:
//   app.use('/api/guests', require('./routes/guests'));

const express = require('express');
const router = express.Router();
const guestService = require('../services/guestService');
const requireAuth  = require('../middleware/auth');

// --- on-stream guests (stream_guests) ---

router.post('/streams/:streamId/join', requireAuth, async (req, res) => {
  try {
    const { displayName, vdoStreamId, mediasoupProducerId } = req.body;
    const guest = await guestService.joinStreamAsGuest({
      streamId: req.params.streamId,
      userId: req.user.id,
      displayName,
      role: 'guest',
      vdoStreamId,
      mediasoupProducerId,
    });
    res.status(201).json(guest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/guests/:guestId', requireAuth, async (req, res) => {
  try {
    const guest = await guestService.updateGuestState(req.params.guestId, req.body, req.user.id);
    if (!guest) return res.status(403).json({ error: 'not found or forbidden' });
    res.json(guest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/streams/:streamId/leave', requireAuth, async (req, res) => {
  try {
    const result = await guestService.leaveStreamAsGuest(req.params.streamId, req.user.id);
    if (!result) return res.status(404).json({ error: 'not an active guest in this stream' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/streams/:streamId', async (req, res) => {
  try {
    const guests = await guestService.getStreamGuests(req.params.streamId);
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- broader room roster (room_participants) ---

router.post('/streams/:streamId/participants', requireAuth, async (req, res) => {
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
  try {
    const participant = await guestService.updateParticipantState(req.params.participantId, req.body, req.user.id);
    if (!participant) return res.status(403).json({ error: 'not found or forbidden' });
    res.json(participant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/streams/:streamId/participants/leave', requireAuth, async (req, res) => {
  try {
    const result = await guestService.leaveRoom(req.params.streamId, req.user.id);
    if (!result) return res.status(404).json({ error: 'not an active participant in this stream' });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/streams/:streamId/participants', async (req, res) => {
  try {
    const participants = await guestService.getRoomParticipants(req.params.streamId);
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
