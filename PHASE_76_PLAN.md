# Phase 76: Desktop Studio + Cross-Device Handoff

Goal: Let creators go live from a desktop browser with camera, screen share,
and studio audio built in -- no phone required -- while chat/moderation run
on the same screen.

## 76a - Desktop Studio shell
- New route: studio.seewhylive.online (or /studio on main domain)
- Reuses existing server/auth.js JWT flow
- Connects to existing mediasoup SFU + Socket.IO
- getDisplayMedia() for screen share, getUserMedia() for camera/mic
- Chat + moderation panel embedded (reuse speaking, hand-raise, send-gift,
  Guardian AI moderation events)

## 76b - Cross-device handoff (copy the link)
- POST /api/studio/handoff-token -- short-lived signed token (5-10 min),
  scoped to userId + communityId
- Mobile: "Copy Studio Link" -> https://studio.seewhylive.online/handoff?token=...
- Desktop exchanges token once for session JWT, single-use, no new DB table

## 76c - Payout eligibility gate
- Eligible = verified account + at least one payment link configured
  (PayPal/CashApp/Venmo/Zelle/Chime)
- No financial logic needed (platform never touches money)
- GET /api/users/me/payout-status checks both conditions

## 76d - Account verification badge
- New column: users.verified BOOLEAN DEFAULT false
- POST /api/verification/request -- pending queue for manual review
- Badge render matches existing PanelTile corner badge pattern

## 76e - Analytics surface (UI only)
- Dashboard pulling from existing analytics.recordEarning(), session revenue
  tracking, gift leaderboards -- no new backend

## Sequencing note
Do not start until current merge (97 commits pulled, server/index.js
guestId + gift/merch handler fix) is confirmed stable and committed.
Treat 76a as its own PR/session, not folded into in-flight work.
