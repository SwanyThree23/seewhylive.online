# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Two Independent App Trees

This repo contains **two completely separate apps** that share a single server. Never conflate them or edit one when the other is intended.

| Tree | Served at | Entry point | Stack |
|------|-----------|-------------|-------|
| `src/` + root `package.json` | `app.seewhylive.online` | `src/main.jsx` | React 18 + Vite + Base44 SDK + Tailwind + ZEGOCLOUD video |
| `frontend/` + `server/` | `seewhylive.online` (prod) / `localhost:3001` (dev) | `frontend/src/App.jsx` | React 18 + Vite + mediasoup-client + Socket.IO |

The production server (`server/`) serves `frontend/dist` as static files and exposes the API on port 3001 behind nginx.

## Commands

### Root app (`src/` — Base44/ZEGO)
```bash
# from repo root
npm install
npm run dev          # Vite dev server
npm run build        # production build → dist/
npm run lint         # eslint (quiet)
npm run lint:fix     # eslint auto-fix
```

### Mediasoup frontend (`frontend/`)
```bash
cd frontend
npm install
npm run dev          # Vite dev server
npm run build        # production build → frontend/dist/
```

### Server (`server/`)
```bash
cd server
npm install
node index.js        # start directly
npm run dev          # nodemon index.js (hot-reload)
# PM2 (production)
pm2 start pm2.config.js
pm2 logs seewhy-server
pm2 restart seewhy-server
```

There are no automated tests. Verify changes by checking PM2 restarts cleanly (`pm2 logs`) and watching the browser console for errors.

## Server Architecture

**Entry: `server/index.js`** — ~2600 lines. Contains:
- Express setup (helmet, cors, rate-limit, xss-clean)
- All Socket.IO connection logic and inline socket handlers
- Many inline Express routes (`app.get/post/delete`) that don't fit neatly into sub-routers
- Requires `server/routes.js` mounted at `/api` (fanout, aura, analytics, moderation, vault, payments, etc.)
- Requires all `server/routes/*.js` sub-routers mounted at `/api`

**Route sub-routers** (`server/routes/*.js`):
- `battles.js`, `challenges.js` — PK battle lifecycle (HTTP side)
- `panelRooms.js` — panel slot management, privacy, invite codes
- `guests.js` — `stream_guests` (mediasoup-wired) + `room_participants`
- `invites.js` — user-to-user invitations + shareable invite links
- `leaderboard.js`, `rewards.js`, `vod.js`, `publicPreview.js`

**Socket handlers** (registered inside `io.on('connection')` in `index.js`):
- `server/socket/battleHandlers.js` — `battle:*` events, countdown timer, vote aggregation
- `server/socket/panelHandlers.js` — `panel:*` events (join, kick, mute, expand, etc.)
- All other socket events (join-room, mediasoup signalling, audio stage, PK v2, chyron, etc.) are inline in `index.js`

**Services** (`server/services/`): Pure DB logic — `battleService`, `panelService`, `guestService`, `inviteService`, `loyaltyService`, `rewardsService`, `challengeService`. Routes call services; services never call routes.

## Dual Database

The server uses **two databases simultaneously**:

- **PostgreSQL (Supabase)** via `server/db.js` (`pool.query(sql, params)` — async/await). Used by all route sub-routers and services for: streams, battles, panel slots, guests, invitations, loyalty, rewards, VOD.
- **SQLite** via `better-sqlite3` (`db.prepare().get/run/all()` — **synchronous, no await**). Used in `server/index.js` inline routes, `analytics.js`, `vault.js` for: rooms, schedules, push subscriptions, super chats, stream keys, stream analytics.

If you see `db.prepare(...)` without `await`, it's SQLite. If you see `await db.query(...)`, it's Postgres. Do not mix them.

SQLite DB path: `process.env.DB_PATH` (default `/opt/seewhy/data/seewhy.db`).

## Auth

`server/middleware/auth.js` — `requireAuth` middleware:
- Reads `Authorization: Bearer <token>`, verifies JWT against `JWT_SECRET`
- Populates `req.user = { id, userId, role }`
- **Dev mode** (no `JWT_SECRET` set): passes through as `{ id: 'anon', role: 'viewer' }` — all routes appear open locally

Socket.IO auth: `socket.auth.token` verified on `connection`; populates `socket.data.userId`, `socket.data.role`, `socket.data.roomId`.

Admin check: `req.user.role !== 'admin'` (string, not a boolean field). Role is embedded in the JWT.

## Immutable Revenue Constants

These values must never be changed and must never appear as anything other than these exact numbers:

```js
CREATOR_SPLIT  = 0.90   // 90% to creator
PLATFORM_FEE   = 0.10   // 10% to platform
// Always Math.floor() for money — never round() or ceil()
```

- In `server/`: defined in `analytics.js`, `battleService.js` (`CREATOR_SPLIT`)
- In `frontend/`: `platformConfig.js` exports `creatorCents()` and `platformCents()`
- The string **"You keep 100%"** must never appear anywhere in the codebase

## Coding Conventions

**`server/`**: CommonJS (`require`/`module.exports`), `'use strict'`, mix of `var` and `const`/`let` is acceptable. Async routes use `async/await` for Postgres, synchronous calls for SQLite.

**`frontend/src/`**: ES modules. Use **`var` only** (not `let`/`const`). Use **`function` expressions only** (not arrow functions in component bodies). **No optional chaining (`?.`) or nullish coalescing (`??`)**. No Tailwind — all styling is inline `style={{}}` objects.

**`src/`** (Base44 app): Same `var`/function-expression rules apply. Uses Radix UI + Tailwind (already configured). Do not introduce new CSS frameworks.

**Design tokens** (both apps):
```
#C9A84C  gold (primary accent)
#0E0C09  near-black (background)
#F0E8D4  cream (text/light surfaces)
#FF1A3C  live-red (live indicator, alerts)
```

## Key Frontend Files (`frontend/src/`)

- `App.jsx` — root, tab routing, Socket.IO connection, lazy-loads all tab components
- `components/LiveRoomPage.jsx` — main live room UI, renders `PanelGrid`
- `components/OctCell.jsx` — individual panel tile (octagonal CSS clip-path), handles own camera acquisition, speaking detection via Web Audio API, mediasoup consumer attachment
- `components/PanelGrid.jsx` — grid of `OctCell`s
- `socket.js` — Socket.IO singleton with auto-rejoin on reconnect
- `webrtc.js` — `SeeWhyRTC` class: mediasoup-client transport setup, produce/consume video+audio
- `platformConfig.js` — revenue split helpers (source of truth for frontend money math)

## Deployment & Infrastructure

- **VPS**: Hostinger, 2 vCPU / 8 GB RAM
- **Process manager**: PM2 — `ecosystem.config.cjs` (repo root) runs `seewhy-server` from `/opt/seewhy/server/index.js` on port 3001
- **Nginx**: reverse-proxies `api.seewhylive.online → :3001`, serves `seewhylive.online` static files, RTMP ingest on port 1935 (nginx-rtmp-module), HLS output to `/var/www/html/hls`
- **RTMP fanout**: `server/routes.js` `/api/fanout-start` spawns FFmpeg processes; `ingest_url` is validated to `rtmp(s)://` only
- **Deploy**: `./deploy.sh` from repo root

## Collision Risk

A parallel session or bot may commit to this repo concurrently. Before editing any file:
1. Re-read it fresh with `Read` — never assume contents from memory or a prior session
2. Note the current line count and key exports so a post-edit diff is possible
3. If the file differs unexpectedly from what was planned, stop and report the discrepancy before proceeding

## Branch Workflow

Work on feature branches (`claude/phase-N` or `claude/<slug>`), squash-merge to `main` via PR. Never push directly to `main`. The GitHub MCP tools (`mcp__github__*`) are used for all PR operations — the `gh` CLI is not available in this environment.
