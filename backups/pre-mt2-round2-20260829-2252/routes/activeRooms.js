const express = require('express');
const router = express.Router();

// Read-only room snapshot. Pulls the live in-memory rooms map from index.js
// via a lazy require to avoid circular-require issues at module load time.
// Never writes to rooms - purely reads Set/Map sizes for a safe refresh.
router.get('/', function(req, res) {
  try {
    const { rooms } = require('../index');
    if (!rooms || typeof rooms.forEach !== 'function') {
      return res.json({ rooms: [] });
    }
    const out = [];
    rooms.forEach(function(room, roomId) {
      var viewerCount = (room && room.viewers) ? room.viewers.size : 0;
      var guestCount = (room && room.guests) ? room.guests.size : 0;
      out.push({
        roomId: roomId,
        viewers: viewerCount,
        guests: guestCount,
        isLive: viewerCount + guestCount > 0
      });
    });
    return res.json({ rooms: out });
  } catch (e) {
    console.error('[active-rooms] read failed', e.message);
    return res.json({ rooms: [] });
  }
});

module.exports = router;
