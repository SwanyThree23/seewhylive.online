#!/bin/bash
set -e

# SeeWhy LIVE v33.0 — One-command VPS install
# Target: Ubuntu 24.04 LTS, IP 2.24.194.112
# Run as root: bash install.sh

SEEWHY_DIR="/opt/seewhy"
LOG_DIR="/var/log/seewhy"
HLS_DIR="/var/www/html/hls"
DASH_DIR="/var/www/html/dash"
DATA_DIR="/opt/seewhy/data"

echo "=== SeeWhy LIVE v33.0 Install ==="
echo "Target: $(hostname) ($(curl -s ifconfig.me 2>/dev/null || echo 'IP unknown'))"

# 1. System update
apt-get update -y
apt-get upgrade -y

# 2. Install dependencies
apt-get install -y \
  curl wget gnupg2 \
  nginx libnginx-mod-rtmp \
  ffmpeg \
  coturn \
  build-essential \
  python3 python3-pip \
  openssl \
  sqlite3 \
  ufw \
  git

# 3. Install Node.js 20
if ! command -v node &>/dev/null || [[ "$(node --version)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# 4. Create directories
mkdir -p "$SEEWHY_DIR/server" "$SEEWHY_DIR/frontend" "$LOG_DIR" "$HLS_DIR" "$DASH_DIR" "$DATA_DIR"
chmod 755 "$LOG_DIR" "$HLS_DIR" "$DASH_DIR"

# 5. Generate SSL cert (self-signed; replace with certbot for production domain)
if [ ! -f /etc/ssl/seewhy.crt ]; then
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/seewhy.key \
    -out /etc/ssl/seewhy.crt \
    -subj "/C=US/ST=State/L=City/O=SeeWhy LIVE/CN=srv1581658.hstgr.cloud"
  chmod 600 /etc/ssl/seewhy.key
  echo "SSL cert generated"
fi

# 6. Generate secrets (idempotent — only generate if .env does not exist)
if [ ! -f "$SEEWHY_DIR/server/.env" ]; then
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  VAULT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  TURN_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

  cat > "$SEEWHY_DIR/server/.env" << ENVEOF
PORT=3001
NODE_ENV=production
FRONTEND_ORIGIN=https://srv1581658.hstgr.cloud
JWT_SECRET=$JWT_SECRET
VAULT_SECRET=$VAULT_SECRET
DB_PATH=$DATA_DIR/seewhy.db
STRIPE_SECRET_KEY=sk_live_REPLACE_ME
STRIPE_PUBLISHABLE_KEY=pk_live_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
ANTHROPIC_API_KEY=sk-ant-REPLACE_ME
OPENAI_API_KEY=sk-REPLACE_ME
DEEPL_API_KEY=REPLACE_ME
TURN_SECRET=$TURN_SECRET
ENVEOF
  chmod 600 "$SEEWHY_DIR/server/.env"
  echo "Generated .env with secrets"
else
  # Load TURN_SECRET from existing .env
  TURN_SECRET=$(grep TURN_SECRET "$SEEWHY_DIR/server/.env" | cut -d= -f2)
  echo ".env already exists, skipping secret generation"
fi

# 7. Copy project files from repo (assumes script is run from repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/server" ]; then
  cp -r "$SCRIPT_DIR/server/"* "$SEEWHY_DIR/server/"
  echo "Server files copied"
fi
if [ -d "$SCRIPT_DIR/frontend" ]; then
  cp -r "$SCRIPT_DIR/frontend/"* "$SEEWHY_DIR/frontend/"
  echo "Frontend files copied"
fi
if [ -f "$SCRIPT_DIR/ecosystem.config.js" ]; then
  cp "$SCRIPT_DIR/ecosystem.config.js" "$SEEWHY_DIR/"
fi

# 8. Install server dependencies
cd "$SEEWHY_DIR/server"
npm install --production 2>&1 | tail -5
echo "Server npm install complete"

# 9. Install frontend dependencies and build
cd "$SEEWHY_DIR/frontend"

# Create frontend .env if not present
if [ ! -f "$SEEWHY_DIR/frontend/.env" ]; then
  cat > "$SEEWHY_DIR/frontend/.env" << FRONTENV
VITE_SOCKET_URL=https://srv1581658.hstgr.cloud:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_REPLACE_ME
FRONTENV
  echo "Created frontend .env"
fi

npm install 2>&1 | tail -5
npm run build 2>&1 | tail -10
echo "Frontend build complete"

# 10. Install PM2 globally
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi
echo "PM2: $(pm2 --version)"

# 11. Start/restart server with PM2
cd "$SEEWHY_DIR"
pm2 delete seewhy-server 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -2
echo "PM2 started"

# 12. Configure nginx
cp "$SCRIPT_DIR/nginx/nginx.conf" /etc/nginx/nginx.conf
nginx -t && systemctl restart nginx
echo "nginx configured and restarted"

# 13. Configure coturn
COTURN_CONF="/etc/turnserver.conf"
if [ -n "$TURN_SECRET" ]; then
  cat > "$COTURN_CONF" << TURNEOF
listening-port=3478
tls-listening-port=5349
listening-ip=2.24.194.112
external-ip=2.24.194.112
realm=srv1581658.hstgr.cloud
server-name=srv1581658.hstgr.cloud
lt-cred-mech
use-auth-secret
static-auth-secret=$TURN_SECRET
log-file=/var/log/seewhy/coturn.log
no-multicast-peers
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
TURNEOF
  # Enable coturn service
  sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn 2>/dev/null || echo "TURNSERVER_ENABLED=1" >> /etc/default/coturn
  systemctl enable coturn
  systemctl restart coturn
  echo "coturn configured and started"
fi

# 14. Configure firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 1935/tcp
ufw allow 3001/tcp
ufw allow 3478/tcp
ufw allow 3478/udp
ufw allow 5349/tcp
ufw allow 5349/udp
ufw allow 49152:65535/udp
ufw --force enable
echo "Firewall configured"

# 15. Write secrets summary
SECRETS_FILE="$SEEWHY_DIR/SECRETS.txt"
cat > "$SECRETS_FILE" << SECEOF
SeeWhy LIVE v33.0 — Generated Secrets
Generated: $(date)

Server: https://srv1581658.hstgr.cloud
RTMP: rtmp://2.24.194.112:1935/live
HLS: https://srv1581658.hstgr.cloud/hls/{roomId}/index.m3u8

.env location: $SEEWHY_DIR/server/.env
(Contains JWT_SECRET, VAULT_SECRET, TURN_SECRET)

NEXT STEPS:
1. Add real API keys to $SEEWHY_DIR/server/.env:
   - STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
   - ANTHROPIC_API_KEY
   - OPENAI_API_KEY
   - DEEPL_API_KEY
2. Restart server: pm2 restart seewhy-server
3. For real SSL: certbot --nginx -d yourdomain.com
4. Point OBS to: rtmp://2.24.194.112:1935/live
   Stream key: {roomId}

Services:
  pm2 status
  systemctl status nginx
  systemctl status coturn
  pm2 logs seewhy-server
SECEOF
chmod 600 "$SECRETS_FILE"

# 16. Final status
echo ""
echo "=== SeeWhy LIVE v33.0 Install Complete ==="
echo ""
echo "Services:"
pm2 list
echo ""
echo "nginx: $(systemctl is-active nginx)"
echo "coturn: $(systemctl is-active coturn)"
echo ""
echo "URLs:"
echo "  App: https://srv1581658.hstgr.cloud"
echo "  API: https://srv1581658.hstgr.cloud/api/health"
echo "  RTMP: rtmp://2.24.194.112:1935/live"
echo ""
echo "SECRETS saved to: $SECRETS_FILE"
echo "Edit .env: $SEEWHY_DIR/server/.env"
echo ""
echo "Next: Add API keys to .env then: pm2 restart seewhy-server"
