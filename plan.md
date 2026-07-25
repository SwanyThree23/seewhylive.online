# Phase 1 Plan — Simulcast + 20-Seat Panel Grid

## Pre-implementation audit (required before any edit)

Branch: `claude/phase-1-simulcast`  
Date: 2026-07-25  
Files read fresh this session (not from memory):

| File | Lines | Key exports / shape |
|------|-------|---------------------|
| `frontend/src/components/OctCell.jsx` | 418 | `React.memo(OctCell, areOctCellPropsEqual)` |
| `frontend/src/components/PanelGrid.jsx` | 124 | `MAX_SEATS = 20`, 5×4 CSS grid |
| `frontend/src/webrtc.js` | 238 | `SeeWhyRTC` class with `publishStream`, `subscribeToProducer` |
| `server/mediasoup.js` | ~420 | `createProducer`, `createConsumer`, `setPreferredLayersByGuestId` |
| `server/index.js` | ~2600 | `speaking` socket handler at line ~1709 |

---

## FINDING: Phase 1 is already fully implemented

Every deliverable described in the Phase 1 brief already exists in `main`. No code changes are needed.

### Simulcast (`setPreferredLayers`)

**`server/mediasoup.js`:**
- `createProducer` (line ~167): video encodings `r0/100kbps, r1/300kbps, r2/900kbps` with `scalabilityMode: 'S1T3'`
- `createConsumer` (line ~268): defaults all video consumers to `spatialLayer: 0` (lowest tier)
- `guestVideoConsumers` (line 19): secondary index `producerGuestId → Set<consumerId>` maintained on create and cleanup
- `setPreferredLayersByGuestId(guestId, spatialLayer)` (line 359): iterates the index and calls `consumer.setPreferredLayers()` on every subscriber — exported at line 417

**`server/index.js` `speaking` handler (line 1709–1717):**
```js
socket.on('speaking', function(data) {
  // ...
  mediasoup.setPreferredLayersByGuestId(guestId, data.speaking ? 2 : 0).catch(function() {});
});
```
Active speakers get `spatialLayer: 2` (900 kbps); silent guests drop to `spatialLayer: 0` (100 kbps).

**`frontend/src/webrtc.js` `publishStream` (line 95–103):**
```js
encodings: [
  { maxBitrate: 100000, scaleResolutionDownBy: 4 },
  { maxBitrate: 300000, scaleResolutionDownBy: 2 },
  { maxBitrate: 900000, scaleResolutionDownBy: 1 }
]
```
Client sends three simulcast layers.

### OctCell `React.memo` (lines 406–417)

Already wrapped with a custom comparator `areOctCellPropsEqual` that bails on:
- `guest.producerId` (new stream source)
- `guest.speaking` (ring glow state)
- `isMuted` / `isCamOff`

Parent re-renders that don't touch these props produce zero child re-renders.

### 20-seat panel grid

`PanelGrid.jsx` has `MAX_SEATS = 20` and a `5 × 4` CSS grid (`gridTemplateColumns: 'repeat(5, minmax(0, 1fr))'`). Empty seats render `+` placeholder tiles. `OctCell` is mounted with `fill={true}` (full-tile rect mode, no octagon clip) inside the grid cells.

---

## Decision required

Because Phase 1 is already done, there are two options:

**Option A — Skip to Phase 2.** Phase 2 (merch-order event migration, `gifts.to_guest_id`, per-guest gift counter, OctCell gift badge) is the next un-built feature. Proceed immediately to Phase 2 plan.md.

**Option B — Verify Phase 1 in the running app first.** Confirm simulcast actually works end-to-end on the VPS (check PM2 logs for `setPreferredLayers` errors, join a room with two guests and observe bandwidth via WebRTC internals) before calling it complete. This requires VPS access.

**Recommendation: Option A.** The server-side code is tested through the security campaign's per-phase audits; the client code is straightforward. Proceed to Phase 2.

---

## Phase 2 preview (what to read before starting)

Files to re-read fresh at the start of Phase 2:
- `frontend/src/components/OctCell.jsx` — where the gift badge will be added
- `frontend/src/components/PanelGrid.jsx` — gift counter state lives here or in App
- `server/index.js` — look for `gift`, `merch-order`, `gifts` socket events
- `server/routes.js` — look for any existing merch/gift HTTP routes
- Supabase schema (`supabase_schema.sql`) — check for `gifts` table and `to_guest_id` column
