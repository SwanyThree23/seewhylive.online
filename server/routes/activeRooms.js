'use strict';
var express = require('express');
var router = express.Router();
var requireAuth = require('../middleware/auth');
var db = require('../db');

// Read-only room snapshot. Pulls the live in-memory rooms map from index.js
// via a lazy require to avoid circular-require issues at module load time.
// Never writes to rooms - purely reads Set/Map sizes for a safe refresh.
// Tenant-scoped: only rooms whose stream record belongs to req.tenantId are returned.
router.get('/', async function(req, res) {
  try {
    var rooms = require('../index').rooms;
    if (!rooms || typeof rooms.forEach !== 'function') {
      return res.json({ rooms: [] });
    }
    var allRoomIds = Array.from(rooms.keys());
    if (!allRoomIds.length) return res.json({ rooms: [] });
    // Use the DB as the source of truth for tenant ownership
    var tenantResult = await db.query(
      "SELECT id FROM streams WHERE id = ANY($1) AND tenant_id = $2 AND (privacy IS NULL OR privacy != 'private')",
      [allRoomIds, req.tenantId]
    );
    var tenantRoomIds = new Set(tenantResult.rows.map(function(r) { return r.id; }));
    var out = [];
    rooms.forEach(function(room, roomId) {
      if (!tenantRoomIds.has(roomId)) return;
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
