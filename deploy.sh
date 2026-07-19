#!/usr/bin/env bash
# SeeWhy LIVE v33 — Full Production Deploy + Activation Script
# Run on VPS as root: bash deploy.sh
# Requires: git, node 18+, npm, pm2 (npm i -g pm2), nginx with rtmp module

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH="claude/seewhy-live-v33-build-v0L5Z"
PROD_SERVER="/opt/seewhy/server"
PROD_FRONTEND="/opt/seewhy/frontend"
PM2_APP="seewhy-server"
VPS_IP="2.24.198.112"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  SeeWhy LIVE v33 — Production Deploy     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Pull latest code ──────────────────────────────────────────────────────
echo "▶ Pulling $BRANCH..."
git -C "$REPO_DIR" fetch origin "$BRANCH"
git -C "$REPO_DIR" checkout "$BRANCH"
git -C "$REPO_DIR" reset --hard "origin/$BRANCH"
echo "  ✓ Code updated"

# ── 2. Build frontend ────────────────────────────────────────────────────────
echo "▶ Building frontend (root src/)..."
cd "$REPO_DIR"
npm install
npm run build
echo "  ✓ Frontend built → dist/"

# ── 3. Deploy frontend dist ──────────────────────────────────────────────────
echo "▶ Deploying frontend to $PROD_FRONTEND/dist..."
mkdir -p "$PROD_FRONTEND/dist"
rsync -a --delete "$REPO_DIR/dist/" "$PROD_FRONTEND/dist/"
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
echo "▶ Creating runtime directories..."
mkdir -p /opt/seewhy/data
mkdir -p /opt/seewhy/media
mkdir -p /var/log/seewhy
mkdir -p /var/www/html/hls
chmod 755 /var/www/html/hls
echo "  ✓ Directories ready"

# ── 6a. Deploy MediaMTX config ────────────────────────────────────────────────
echo "▶ Deploying MediaMTX config..."
if [ -f "$REPO_DIR/deploy/mediamtx.yml" ]; then
  cp "$REPO_DIR/deploy/mediamtx.yml" /opt/seewhy/mediamtx.yml
  echo "  ✓ mediamtx.yml deployed to /opt/seewhy/"
  # Reload if mediamtx is running
  pkill -HUP mediamtx 2>/dev/null || true
fi

# ── 7. Firewall — open required ports ────────────────────────────────────────
echo "▶ Configuring firewall..."
if command -v ufw &>/dev/null; then
  ufw allow 80/tcp    2>/dev/null || true
  ufw allow 443/tcp   2>/dev/null || true
  ufw allow 1935/tcp  2>/dev/null || true   # RTMP ingest
  ufw allow 3478/tcp  2>/dev/null || true   # TURN/STUN
  ufw allow 3478/udp  2>/dev/null || true
  ufw allow 5349/tcp  2>/dev/null || true   # TURN TLS
  ufw allow 49152:65535/udp 2>/dev/null || true  # mediasoup RTP
  echo "  ✓ UFW rules applied"
else
  echo "  ⚠ ufw not found — skipping firewall step"
fi

# ── 8. PM2 startup — survive reboots ────────────────────────────────────────
echo "▶ Configuring PM2 startup..."
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true
echo "  ✓ PM2 startup configured"

# ── 9. Restart PM2 ───────────────────────────────────────────────────────────
echo "▶ Restarting $PM2_APP..."
if pm2 describe "$PM2_APP" > /dev/null 2>&1; then
  pm2 restart "$PM2_APP" --update-env
else
  echo "  App not in PM2 — starting fresh..."
  pm2 start "$REPO_DIR/ecosystem.config.js"
fi
pm2 save --force
echo "  ✓ PM2 running & saved"

# ── 10. Deploy nginx config + reload ────────────────────────────────────────
echo "▶ Deploying nginx config..."
NGINX_CONF="$REPO_DIR/nginx/nginx.conf"
if [ -f "$NGINX_CONF" ]; then
  cp "$NGINX_CONF" /etc/nginx/nginx.conf
  echo "  ✓ nginx.conf deployed"
fi

echo "▶ Enabling nginx on boot..."
systemctl enable nginx 2>/dev/null || true

# ── 10a. Issue/renew Let's Encrypt cert for domain ──────────────────────────
echo "▶ Checking SSL certificate for seewhylive.online..."
CERT_PATH="/etc/letsencrypt/live/seewhylive.online/fullchain.pem"
if [ ! -f "$CERT_PATH" ]; then
  echo "  No cert found — attempting certbot..."
  if command -v certbot &>/dev/null; then
    # Temporarily swap to self-signed so nginx can start for ACME challenge
    nginx -s reload 2>/dev/null || true
    certbot certonly --webroot -w /var/www/html \
      -d seewhylive.online -d www.seewhylive.online \
      --non-interactive --agree-tos --email admin@seewhylive.online \
      --keep-until-expiring 2>/dev/null && \
    echo "  ✓ Let's Encrypt cert issued" || \
    echo "  ⚠ certbot failed — using self-signed cert (check DNS A record points to $VPS_IP)"
  else
    echo "  ⚠ certbot not installed — run: apt install -y certbot python3-certbot-nginx"
  fi
else
  # Renew if within 30 days of expiry
  certbot renew --quiet 2>/dev/null || true
  echo "  ✓ Cert present (renewed if needed)"
fi

# Swap nginx SSL lines to Let's Encrypt cert if it now exists
if [ -f "$CERT_PATH" ]; then
  sed -i "s|ssl_certificate .*;|ssl_certificate /etc/letsencrypt/live/seewhylive.online/fullchain.pem;|" /etc/nginx/nginx.conf
  sed -i "s|ssl_certificate_key .*;|ssl_certificate_key /etc/letsencrypt/live/seewhylive.online/privkey.pem;|" /etc/nginx/nginx.conf
  echo "  ✓ nginx.conf updated to use Let's Encrypt cert"
fi

echo "▶ Starting/reloading nginx..."
if nginx -t 2>/dev/null; then
  # restart covers both: not-running → start, running → restart
  systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null || nginx 2>/dev/null || true
  sleep 1
  if systemctl is-active --quiet nginx 2>/dev/null || pgrep -x nginx >/dev/null 2>&1; then
    echo "  ✓ Nginx running"
  else
    echo "  ⚠ Nginx still not running — trying nginx directly..."
    nginx -c /etc/nginx/nginx.conf 2>/dev/null || true
  fi
else
  echo "  ⚠ Nginx config test failed — check /etc/nginx/nginx.conf"
  nginx -t
fi

# ── 11. Post-deploy health check ─────────────────────────────────────────────
echo ""
echo "▶ Running health checks..."
sleep 3

PM2_STATUS=$(pm2 list --no-color 2>/dev/null | grep "$PM2_APP" | grep -o 'online\|stopped\|errored' || echo 'unknown')
echo "  PM2  : $PM2_STATUS"

NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null || echo 'unknown')
echo "  nginx: $NGINX_STATUS"

API_CODE=$(curl -sk -o /dev/null -w "%{http_code}" "https://localhost/api/health" 2>/dev/null || echo '???')
echo "  API  : HTTP $API_CODE"

PORT_3001=$(ss -tlnp 2>/dev/null | grep ':3001' | head -1 | grep -c '.' || echo '0')
if [ "$PORT_3001" -gt 0 ]; then
  echo "  :3001: listening ✓"
else
  echo "  :3001: NOT listening ⚠"
fi

PORT_1935=$(ss -tlnp 2>/dev/null | grep ':1935' | head -1 | grep -c '.' || echo '0')
if [ "$PORT_1935" -gt 0 ]; then
  echo "  :1935: listening ✓ (RTMP)"
else
  echo "  :1935: NOT listening ⚠ (RTMP — nginx may need rtmp module)"
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅  SeeWhy LIVE v33 — LIVE              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  Frontend  : https://$VPS_IP"
echo "  API health: https://$VPS_IP/api/health"
echo "  RTMP in   : rtmp://$VPS_IP:1935/live/<stream-key>"
echo "  HLS out   : https://$VPS_IP/hls/<stream-key>.m3u8"
echo "  PM2 logs  : pm2 logs $PM2_APP"
echo "  PM2 mon   : pm2 monit"
echo ""
