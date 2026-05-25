#!/usr/bin/env bash
# SeeWhy LIVE v33 — VPS Deploy Script
# Run on VPS: bash deploy.sh
# Requires: git, node 18+, npm, pm2 (npm i -g pm2)

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="claude/seewhy-live-v33-build-v0L5Z"
PROD_SERVER="/opt/seewhy/server"
PROD_FRONTEND="/opt/seewhy/frontend"
PM2_APP="seewhy-server"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  SeeWhy LIVE v33 — Production Deploy     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Pull latest code ──────────────────────────────────────────────────────
echo "▶ Pulling $BRANCH..."
git -C "$REPO_DIR" fetch origin "$BRANCH"
git -C "$REPO_DIR" checkout "$BRANCH"
git -C "$REPO_DIR" pull origin "$BRANCH"
echo "  ✓ Code updated"

# ── 2. Build frontend ────────────────────────────────────────────────────────
echo "▶ Building frontend..."
cd "$REPO_DIR/frontend"
npm install --omit=dev
npm run build
echo "  ✓ Frontend built → frontend/dist/"

# ── 3. Deploy frontend dist ──────────────────────────────────────────────────
echo "▶ Deploying frontend to $PROD_FRONTEND/dist..."
mkdir -p "$PROD_FRONTEND/dist"
rsync -a --delete "$REPO_DIR/frontend/dist/" "$PROD_FRONTEND/dist/"
echo "  ✓ Frontend deployed"

# ── 4. Deploy server files ───────────────────────────────────────────────────
echo "▶ Deploying server to $PROD_SERVER..."
mkdir -p "$PROD_SERVER"
rsync -a --exclude='node_modules' --exclude='*.log' \
  "$REPO_DIR/server/" "$PROD_SERVER/"
echo "  ✓ Server files synced"

# ── 5. Install server dependencies ──────────────────────────────────────────
echo "▶ Installing server dependencies..."
cd "$PROD_SERVER"
npm install --omit=dev
echo "  ✓ Dependencies installed"

# ── 6. Ensure production directories exist ───────────────────────────────────
mkdir -p /opt/seewhy/data
mkdir -p /var/log/seewhy
mkdir -p /var/www/html/hls

# ── 7. Restart PM2 ───────────────────────────────────────────────────────────
echo "▶ Restarting $PM2_APP..."
if pm2 describe "$PM2_APP" > /dev/null 2>&1; then
  pm2 restart "$PM2_APP"
else
  echo "  App not in PM2 — starting fresh..."
  pm2 start "$REPO_DIR/ecosystem.config.js"
fi
pm2 save
echo "  ✓ PM2 restarted"

# ── 8. Reload nginx ──────────────────────────────────────────────────────────
echo "▶ Reloading nginx..."
if nginx -t 2>/dev/null; then
  systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || true
  echo "  ✓ Nginx reloaded"
else
  echo "  ⚠ Nginx config test failed — skipping reload"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "✅ Deploy complete!"
echo ""
echo "  Frontend : https://seewhylive.online"
echo "  API      : https://seewhylive.online/api/health"
echo "  RTMP     : rtmp://2.24.194.112:1935/live"
echo "  PM2 logs : pm2 logs $PM2_APP"
echo ""
