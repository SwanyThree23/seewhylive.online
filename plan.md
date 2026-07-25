# Phase 2 Plan — Merch Event Split + Per-Guest Gift Counter

## Pre-implementation audit

Branch: `claude/phase-1-simulcast` (Phase 2 commits land here; rename PR if desired)
Date: 2026-07-25

Files read fresh this session:

| File | Lines | Relevant current state |
|------|-------|------------------------|
| `server/index.js` | ~2800 | `gifts` table DDL (line ~129), `send-gift` handler (line ~1591), no `merch-order` event |
| `frontend/src/components/LiveRoomPage.jsx` | >2500 | `giftCount` state (line ~375), `gift-received` handler (line ~449), no per-guest gift tracking |
| `frontend/src/components/PanelGrid.jsx` | 124 | no `giftTotals` prop |
| `frontend/src/components/OctCell.jsx` | 418 | no gift badge; `areOctCellPropsEqual` does not include giftTotal |

---

## Gap analysis — what is MISSING

### Server

| Item | Status |
|------|--------|
| `gifts.to_guest_id` column | Missing — schema has `id, room_id, from_user, emoji, name, value_cents, creator_cents, platform_cents, ts` |
| `send-gift` reading/storing `toGuestId` | Missing |
| `gift-received` event carrying `toGuestId` | Missing |
| `merch-order` socket event + revenue split | Missing entirely |

### Frontend

| Item | Status |
|------|--------|
| `guestGiftTotals` state in `LiveRoomPage.jsx` | Missing — only `giftCount` (scalar) exists |
| `giftTotals` prop on `PanelGrid` | Missing |
| `giftTotal` prop on `OctCell` | Missing |
| Gift badge rendered inside `OctCell` | Missing |
| `areOctCellPropsEqual` includes `giftTotal` | Missing |

---

## Implementation plan

### Change 1 — `server/index.js`: schema migration

Add `to_guest_id` after the existing `db.exec(...)` that creates the `gifts` table.
Use `try/catch` so it is a no-op on subsequent starts when the column already exists.

```js
try { db.exec('ALTER TABLE gifts ADD COLUMN to_guest_id TEXT'); } catch(_) {}
```

### Change 2 — `server/index.js`: `send-gift` handler

In the `send-gift` handler (line ~1591):
- Read `var toGuestId = data.toGuestId || null;` from the payload
- Add `to_guest_id` to the INSERT columns/values
- Add `toGuestId` to the `gift-received` broadcast payload

Revenue math is unchanged (`Math.floor(valueCents * CREATOR)`).

### Change 3 — `server/index.js`: new `merch-order` socket handler

New handler after `send-gift`, same pattern:

```
socket.on('merch-order', function(data) {
  roomId, buyerUser, itemName, priceCents, toGuestId (nullable)
  → validates priceCents > 0
  → Math.floor(priceCents * CREATOR) / platformCents
  → INSERT INTO gifts (reusing the gifts table; name = itemName, emoji = '👕')
  → io.to(roomId).emit('merch-order-received', { ...split, toGuestId })
  → analytics.recordEarning(...)
  → AURA trigger if priceCents >= 100
})
```

Reusing the `gifts` table keeps revenue reporting unified. No new table needed.

### Change 4 — `frontend/src/components/LiveRoomPage.jsx`

Add one new state variable (after the existing `giftCount` line):
```js
var [guestGiftTotals, setGuestGiftTotals] = useState({});  // { [guestId]: totalCents }
```

Update the `gift-received` handler: when `gift.toGuestId` is set, merge the cents into `guestGiftTotals`.

Update the `merch-order-received` handler (new): same merge if `toGuestId` is set.

Pass `guestGiftTotals` into `PanelGrid` as a new `giftTotals` prop.

### Change 5 — `frontend/src/components/PanelGrid.jsx`

Accept `giftTotals` prop (object, default `{}`). In the `OctCell` mount for occupied seats, pass:
```js
giftTotal={giftTotals[(g.guestId || g.userId)] || 0}
```

Also add `onCameraTrack` to the forwarded props (it is accepted by OctCell but currently missing from PanelGrid's passthrough — minor fix while here).

### Change 6 — `frontend/src/components/OctCell.jsx`

Accept `giftTotal` prop (number, default 0).

Render a small badge **inside the video container**, bottom-left, when `giftTotal > 0`:
```
🎁 $X.XX
```
Positioned: `position: 'absolute', bottom: 6, left: 6, zIndex: 5`
Style: gold background tint, DM Mono font, 7px, same treatment as existing MUTED badge.

Update `areOctCellPropsEqual` to include `prev.giftTotal === next.giftTotal` so badge
updates without unnecessary full re-renders.

---

## Revenue invariants — verified

- `Math.floor(priceCents * CREATOR)` used for both gift and merch split ✓
- `platformCents = priceCents - creatorCents` (no rounding loss) ✓
- String "You keep 100%" does not appear in any new code ✓

---

## Sequencing

1. Server changes (1–3) together — one commit
2. Frontend changes (4–6) together — one commit
3. Verify: PM2 restarts cleanly, no SQLite errors in log, `gift-received` payload
   contains `toGuestId` field, OctCell badge visible in browser with non-zero total

## Files to change

- `server/index.js`
- `frontend/src/components/LiveRoomPage.jsx`
- `frontend/src/components/PanelGrid.jsx`
- `frontend/src/components/OctCell.jsx`
